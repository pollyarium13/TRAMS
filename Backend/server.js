require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode    = require('qrcode');
const { randomUUID } = require('crypto');
const nodemailer = require('nodemailer');

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[character]));
}

function normalizeAccountType(accountType) {
    const value = String(accountType || '').trim().toLowerCase();
    if (value === 'admin' || value === 'administrator') {
        return { key: 'Admin', label: 'Administrator', includePassword: true };
    }
    if (value === 'super admin' || value === 'super administrator' || value === 'superadmin') {
        return { key: 'Super Admin', label: 'Super Administrator', includePassword: true };
    }
    return { key: 'User', label: 'User', includePassword: false };
}

function buildQrPayload(account, accountId) {
    const scannerId = accountId || account.client_id || account.frontend_id || account.employee_id;
    return 'TRAMS:' + scannerId;
}

function buildAccountEmail({ account, typeInfo }) {
    const fullName = [account.first_name, account.last_name].filter(Boolean).join(' ') || account.username;
    const usernameRow = typeInfo.includePassword
        ? `<p><b>Username:</b> ${escapeHtml(account.username)}</p>`
        : '';
    const passwordRow = typeInfo.includePassword
        ? `<p><b>Password:</b> ${escapeHtml(account.password)}</p>`
        : '';

    return `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2933;line-height:1.45;">
            <h2 style="margin-bottom:8px;">Welcome${fullName ? ', ' + escapeHtml(fullName) : ''}!</h2>
            <p>Your TRAMS account has been created.</p>
            <p><b>Account Type:</b> ${escapeHtml(typeInfo.label)}</p>
            ${usernameRow}
            ${passwordRow}
            <p><b>QR Code:</b></p>
            <p><img src="cid:trams-qrcode" alt="TRAMS QR Code" style="width:220px;height:220px;border:1px solid #d9e2ec;padding:8px;"></p>
            <p>Your QR code is also attached as <b>qrcode.png</b>.</p>
            ${typeInfo.includePassword ? '<p style="color:#6b7280;font-size:12px;">Please change your password after your first login.</p>' : ''}
        </div>
    `;
}

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static('../Frontend'));

const dbHost = String(process.env.DB_HOST || '127.0.0.1').trim();
const db = mysql.createPool({
    host: dbHost === 'localhost' ? '127.0.0.1' : dbHost,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 10000)
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        console.error('Check that XAMPP MySQL is running and that DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME in Backend/.env are correct.');
    } else {
        console.log('MySQL connected');
        connection.release();
    }
});

function accountTypeKey(value) {
    return normalizeAccountType(value).key;
}

function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) {
        return res.status(401).json({ message: 'Missing authorization token' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired authorization token' });
    }
}

function roleFilteredAccountsSql(user, baseWhere = '', params = []) {
    const role = accountTypeKey(user.account_type);
    const where = [];
    const values = [...params];

    if (baseWhere) where.push(baseWhere);
    if (role === 'Admin') {
        where.push("account_type <> 'Super Admin'");
    } else if (role !== 'Super Admin') {
        where.push('id = ?');
        values.push(user.id);
    }

    return {
        whereSql: where.length ? ' WHERE ' + where.join(' AND ') : '',
        values
    };
}

function parseQrPayload(value) {
    if (value && typeof value === 'object') return value;
    try { return JSON.parse(String(value || '{}')); } catch (error) { return {}; }
}

function publicAccount(row) {
    return {
        id: row.id,
        account_type: row.account_type,
        rank: row.rank,
        first_name: row.first_name,
        middle_initial: row.middle_initial,
        last_name: row.last_name,
        serial_number: row.serial_number,
        username: row.username,
        email_address: row.email_address,
        contact_number: row.contact_number,
        service: row.service,
        department: row.department,
        photo: row.photo,
        qr_payload: row.qr_payload
    };
}

function photoByteLength(photo) {
    const base64 = String(photo || '').split(',')[1] || String(photo || '');
    return Math.ceil(base64.length * 3 / 4);
}

function validatePhotoPayload(photo) {
    if (!photo) return null;
    const maxPhotoBytes = 700 * 1024;
    if (photoByteLength(photo) > maxPhotoBytes) {
        return `Profile photo is too large. Please upload a smaller image under ${Math.round(maxPhotoBytes / 1024)}KB.`;
    }
    return null;
}





/* LOGIN */
app.post('/api/auth/login', (req, res) => {

    const { username, password } = req.body;

    const sql = 'SELECT * FROM accounts WHERE username = ?';

    db.query(sql, [username], async (err, results) => {

        if (err) {
            return res.status(500).json(err);
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: 'Invalid username'
            });
        }

        const user = results[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({
                message: 'Invalid password'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                account_type: user.account_type
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES }
        );

        res.json({
            message: 'Login successful',
            token,
            user
        });

    });

});


app.post('/api/accounts', async (req, res) => {
    try {
        const {
            account_type, rank, first_name, middle_name, middle_initial,
            last_name, serial_number, username, password,
            email_address, contact_number, service, department,
            client_id, frontend_id, employee_id, photo
        } = req.body;

        const typeInfo = normalizeAccountType(account_type);
        const accountPassword = typeInfo.includePassword
            ? (password || Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase())
            : randomUUID() + randomUUID();

        if (!account_type || !username || !email_address) {
            return res.status(400).json({
                message: 'account_type, username, and email_address are required'
            });
        }

        const photoError = validatePhotoPayload(photo);
        if (photoError) {
            return res.status(413).json({ message: photoError });
        }

        const hashedPassword = await bcrypt.hash(String(accountPassword), 10);
        const middleInitial = middle_initial || middle_name || null;
        const qr_payload    = buildQrPayload({
            account_type, rank, first_name, middle_name, middle_initial: middleInitial,
            last_name, serial_number, username, email_address, service, department,
            client_id, frontend_id, employee_id
        }, randomUUID());

        const sql = `
        INSERT INTO accounts (
            account_type, rank, first_name, middle_initial,
            last_name, serial_number, username, password_hash,
            email_address, contact_number, service, department, photo, qr_payload
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, [
            typeInfo.key, rank, first_name, middleInitial,
            last_name, serial_number, username, hashedPassword,
            email_address, contact_number, service, department, photo, qr_payload
        ], async (err, result) => {

            if (err) return res.status(500).json(err);
            try {
            const emailQrPayload = 'TRAMS:' + result.insertId;
            await db.promise().query('UPDATE accounts SET qr_payload = ? WHERE id = ?', [emailQrPayload, result.insertId]);
            const qrDataURL = await QRCode.toDataURL(emailQrPayload, {
                width: 1000,
                margin: 4,
                errorCorrectionLevel: 'M'
            });
            const qrBase64 = qrDataURL.split('base64,')[1];

            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                throw new Error('EMAIL_USER and EMAIL_PASS must be set in Backend/.env');
            }

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            await transporter.verify();

            await transporter.sendMail({
                from: `TRAMS <${process.env.EMAIL_USER}>`,
                to:   email_address,
                subject: `TRAMS - ${typeInfo.label} Account Details`,
                html: buildAccountEmail({
                    account: { first_name, last_name, username, password: typeInfo.includePassword ? accountPassword : '' },
                    typeInfo
                }),
                attachments: [
                    {
                        filename: 'qrcode.png',
                        content:  qrBase64,
                        encoding: 'base64',
                        cid: 'trams-qrcode'
                    }
                ]
            });

            res.json({
                message: 'Account created and email sent successfully',
                id: result.insertId,
                qr_payload: emailQrPayload
            });
            } catch (mailError) {
                console.error('Account created, but post-create delivery failed:', mailError.message);
                res.status(201).json({
                    message: 'Account created, but email delivery failed',
                    email_status: 'failed',
                    email_error: mailError.message,
                    id: result.insertId,
                    qr_payload: 'TRAMS:' + result.insertId
            });
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error', sqlMessage: error.sqlMessage || error.message });
    }
});



/* UPDATE ACCOUNT */
app.put('/api/accounts/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const {
            account_type, rank, first_name, middle_name, middle_initial,
            last_name, serial_number, username, password,
            email_address, contact_number, service, department,
            client_id, frontend_id, employee_id, photo
        } = req.body;

        const photoError = validatePhotoPayload(photo);
        if (photoError) {
            return res.status(413).json({ message: photoError });
        }

        const currentRows = await db.promise().query('SELECT * FROM accounts WHERE id = ?', [id]);
        const current = currentRows[0][0];
        if (!current) {
            return res.status(404).json({ message: 'Account not found' });
        }

        const hasPhotoUpdate = Object.prototype.hasOwnProperty.call(req.body, 'photo');
        const next = {
            account_type: account_type ? accountTypeKey(account_type) : current.account_type,
            rank: rank ?? current.rank,
            first_name: first_name ?? current.first_name,
            middle_initial: middle_initial ?? middle_name ?? current.middle_initial,
            last_name: last_name ?? current.last_name,
            serial_number: serial_number ?? current.serial_number,
            username: username ?? current.username,
            email_address: email_address ?? current.email_address,
            contact_number: contact_number ?? current.contact_number,
            service: service ?? current.service,
            department: department ?? current.department,
            photo: hasPhotoUpdate ? photo : current.photo
        };

        const qr_payload = buildQrPayload({
            ...next,
            client_id,
            frontend_id,
            employee_id
        }, id);

        const values = [
            next.account_type,
            next.rank,
            next.first_name,
            next.middle_initial,
            next.last_name,
            next.serial_number,
            next.username,
            next.email_address,
            next.contact_number,
            next.service,
            next.department
        ];

        let photoSql = '';
        if (hasPhotoUpdate) {
            photoSql = ', photo = ?';
            values.push(next.photo);
        }

        values.push(qr_payload);

        let passwordSql = '';
        if (password) {
            passwordSql = ', password_hash = ?';
            values.push(await bcrypt.hash(String(password), 10));
        }

        values.push(id);

        const sql = `
        UPDATE accounts
        SET account_type = ?, rank = ?, first_name = ?, middle_initial = ?,
            last_name = ?, serial_number = ?, username = ?, email_address = ?,
            contact_number = ?, service = ?, department = ?${photoSql}, qr_payload = ?
            ${passwordSql}
        WHERE id = ?
        `;

        await db.promise().query(sql, values);
        res.json({ message: 'Account updated successfully', qr_payload });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error', sqlMessage: error.sqlMessage || error.message });
    }
});




/* DELETE ACCOUNT */
app.delete('/api/accounts/:id', requireAuth, async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await db.promise().query('SELECT * FROM accounts WHERE id = ?', [id]);
        const account = rows[0];

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        const requesterRole = accountTypeKey(req.user.account_type);
        const targetRole = accountTypeKey(account.account_type);

        if (requesterRole === 'Admin' && targetRole === 'Super Admin') {
            return res.status(403).json({ message: 'Admins cannot delete Super Admin accounts' });
        }

        if (requesterRole !== 'Admin' && requesterRole !== 'Super Admin' && String(req.user.id) !== String(id)) {
            return res.status(403).json({ message: 'You are not allowed to delete this account' });
        }

        await db.promise().query('DELETE FROM attendance_logs WHERE employee_id = ?', [id]);
        const [result] = await db.promise().query('DELETE FROM accounts WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Account not found' });
        }

        res.json({
            message: 'Account deleted successfully',
            id: Number(id)
        });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Delete failed', sqlMessage: err.sqlMessage || err.message });
    }
});





/* SAVE ATTENDANCE */
app.post('/api/attendance', (req, res) => {

    const {
        employee_id,
        log_type
    } = req.body;

    const sql = `
    INSERT INTO attendance_logs (
        employee_id,
        log_type
    )
    VALUES (?, ?)
    `;

    db.query(sql, [
        employee_id,
        log_type
    ], (err, result) => {

        if (err) {
            return res.status(500).json(err);
        }

        res.json({
            message: 'Attendance saved successfully'
        });

    });

});


/* GET ALL ACCOUNTS */
app.get('/api/accounts', requireAuth, (req, res) => {
    const filter = roleFilteredAccountsSql(req.user);
    const sql = 'SELECT * FROM accounts' + filter.whereSql + ' ORDER BY id DESC';

    db.query(sql, filter.values, (err, results) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json(results);
    });
});




/* GET SINGLE ACCOUNT */
app.get('/api/accounts/:id', requireAuth, (req, res) => {
    const id = req.params.id;
    const filter = roleFilteredAccountsSql(req.user, 'id = ?', [id]);
    const sql = 'SELECT * FROM accounts' + filter.whereSql;

    db.query(sql, filter.values, (err, results) => {
        if (err) {
            return res.status(500).json(err);
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Account not found' });
        }
        res.json(results[0]);
    });
});




/* SCAN ATTENDANCE QR */
app.post('/api/attendance/scan', (req, res) => {
    const qrText = req.body.qrText || req.body.qr_payload || req.body.payload || req.body.code || '';
    const parsedPayload = parseQrPayload(qrText);
    const rawScannedId = String(parsedPayload.employeeId || parsedPayload.id || parsedPayload.serialNumber || parsedPayload.username || qrText || '').trim();
    const scannedId = rawScannedId.replace(/^TRAMS:/i, '').trim();

    if (!scannedId) {
        return res.status(400).json({ message: 'QR payload is required' });
    }

    db.query('SELECT * FROM accounts', (err, accounts) => {
        if (err) return res.status(500).json(err);

        const account = accounts.find(row => {
            const storedPayload = parseQrPayload(row.qr_payload);
            const candidates = [
                row.id,
                row.username,
                row.serial_number,
                storedPayload.employeeId,
                storedPayload.id,
                storedPayload.serialNumber,
                row.qr_payload,
                'TRAMS:' + row.id,
                'TRAMS:' + row.username,
                'TRAMS:' + row.serial_number
            ].map(value => String(value || '').trim());

            return candidates.includes(scannedId) || String(row.qr_payload || '').trim() === String(qrText || '').trim();
        });

        if (!account) {
            return res.status(404).json({ message: 'Account not found for this QR code' });
        }

        db.query(
            'SELECT * FROM attendance_logs WHERE employee_id = ? ORDER BY timestamp DESC LIMIT 1',
            [account.id],
            (lastErr, lastRows) => {
                if (lastErr) return res.status(500).json(lastErr);

                const lastType = lastRows[0]?.log_type || lastRows[0]?.type;
                const logType = String(lastType).toUpperCase() === 'IN' ? 'OUT' : 'IN';

                db.query(
                    'INSERT INTO attendance_logs (employee_id, log_type) VALUES (?, ?)',
                    [account.id, logType],
                    (insertErr, result) => {
                        if (insertErr) return res.status(500).json(insertErr);
                        res.json({
                            message: 'Attendance scan saved successfully',
                            action: logType,
                            log: {
                                id: result.insertId,
                                employee_id: account.id,
                                employeeId: account.id,
                                type: logType,
                                log_type: logType,
                                timestamp: new Date().toISOString()
                            },
                            account: publicAccount(account)
                        });
                    }
                );
            }
        );
    });
});


/* GET ATTENDANCE LOGS */
app.get('/api/attendance', requireAuth, (req, res) => {
    const role = accountTypeKey(req.user.account_type);
    const where = [];
    const params = [];

    if (role === 'Admin') {
        where.push("accounts.account_type <> 'Super Admin'");
    } else if (role !== 'Super Admin') {
        where.push('accounts.id = ?');
        params.push(req.user.id);
    }

    const sql = `
    SELECT
        attendance_logs.*,
        attendance_logs.log_type AS type,
        accounts.id AS account_id,
        accounts.account_type,
        accounts.rank,
        accounts.first_name,
        accounts.middle_initial,
        accounts.last_name,
        accounts.serial_number,
        accounts.username,
        accounts.email_address,
        accounts.department,
        accounts.service,
        accounts.photo
    FROM attendance_logs
    JOIN accounts
    ON attendance_logs.employee_id = accounts.id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY attendance_logs.timestamp DESC
    `;

    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json(results);
    });
});


/* GET LAST ATTENDANCE OF EMPLOYEE */
app.get('/api/attendance/last/:employee_id', (req, res) => {

    const employee_id = req.params.employee_id;

    const sql = `
    SELECT *
    FROM attendance_logs
    WHERE employee_id = ?
    ORDER BY timestamp DESC
    LIMIT 1
    `;

    db.query(sql, [employee_id], (err, results) => {

        if (err) {
            return res.status(500).json(err);
        }

        if (results.length === 0) {
            return res.json(null);
        }

        res.json(results[0]);

    });

});

const path = require('path');

// Serve login page at root
app.get('/login', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../Frontend/Log_In_Page/Log_In_Page.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../Frontend/Log_In_Page/Log_In_Page.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../Frontend/Admin/Admin.html'));
});

app.get('/super-admin', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../Frontend/Super_Admin/Super_Admin.html'));
});

app.get('/qr-scanner', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../Frontend/QR_Scanner/QR_Scanner_Portal.html'));
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
