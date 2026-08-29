# TRAMS

### Transportation Registration and Management System

> A full-stack web-based Transportation Registration and Management System designed to streamline transportation registration, administrative management, and QR-based verification.

---

## 📌 About the Project

**TRAMS (Transportation Registration and Management System)** is a full-stack web application developed to provide a centralized platform for managing transportation-related registration and administrative operations.

The system provides dedicated interfaces for different users, including regular users, administrators, and super administrators. It also includes a QR scanning portal for convenient verification and processing.

The project is organized into separate **Frontend** and **Backend** components, making the system easier to maintain, develop, and scale.

---

## ✨ Features

### 🔐 User Authentication

* User login interface
* Secure authentication workflow
* Role-based access to system functionality

### 👨‍💼 Admin Management

* Dedicated Admin interface
* Administrative management features
* Centralized access to system operations

### 👑 Super Admin

* Dedicated Super Admin interface
* Higher-level system management capabilities
* Administrative oversight

### 📱 QR Code Scanner

* Dedicated QR Scanner portal
* QR-based verification workflow
* Designed for fast and convenient scanning

### 🖥️ Web Interface

* Structured frontend interface
* Separate pages for different system functions
* Organized CSS and JavaScript components

### 🗄️ Backend

* Server-side application
* API/backend functionality
* Database connectivity
* Health-check script for backend/database monitoring

---

## 🛠️ Technologies Used

> Update this section with the exact technologies used in your implementation.

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* [Express.js / Other Backend Framework]

### Database

* [MySQL / Your Database]

### Development Tools

* Git
* GitHub
* Visual Studio Code

---

## 📂 Project Structure

```text
TRAMS/
│
├── Backend/
│   ├── scripts/
│   │   └── mysql-health-check.ps1
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── Frontend/
│   │
│   ├── Admin/
│   │   ├── Admin.html
│   │   ├── admin.css
│   │   └── admin.js
│   │
│   ├── Assets/
│   │   ├── TRAMS_1.jpg
│   │   ├── TRAMS_2.jpg
│   │   ├── TRAMS_3.jpg
│   │   ├── TRAMS_QR.jpg
│   │   └── TRAMS_logo.png
│   │
│   ├── Log_In_Page/
│   │   ├── Log_In_Page.html
│   │   ├── log_in_page.css
│   │   └── log_in_page.js
│   │
│   ├── QR_Scanner/
│   │   ├── QR_Scanner_Portal.html
│   │   ├── qr_scanner.css
│   │   └── qr_scanner.js
│   │
│   └── Super_Admin/
│       ├── Super_Admin.html
│       ├── super_admin.css
│       └── super_admin.js
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

Follow these steps to run TRAMS locally.

### 1. Clone the Repository

```bash
git clone https://github.com/pollyarium13/TRAMS.git
```

Navigate into the project:

```bash
cd TRAMS
```

---

## ⚙️ Backend Setup

Navigate to the backend directory:

```bash
cd Backend
```

Install the required dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env` file inside the `Backend` directory.

Example:

```env
PORT=5000
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
```

> **Important:** Never commit your `.env` file or database credentials to GitHub.

Start the backend server:

```bash
npm start
```

If your project uses a development script, you can also use:

```bash
npm run dev
```

---

## 🌐 Frontend Setup

Open the `Frontend` directory:

```text
Frontend/
```

The frontend contains the different interfaces used by the TRAMS system.

Depending on your development setup, the frontend can be opened using:

* Visual Studio Code Live Server
* A local web server
* Your configured frontend development server

Open the login page to begin:

```text
Frontend/Log_In_Page/Log_In_Page.html
```

---

## 🔑 User Interfaces

TRAMS contains several dedicated interfaces.

### Login

```text
Frontend/Log_In_Page/
```

Provides the main authentication interface.

### Admin

```text
Frontend/Admin/
```

Provides administrative functionality.

### Super Admin

```text
Frontend/Super_Admin/
```

Provides higher-level administrative functionality.

### QR Scanner

```text
Frontend/QR_Scanner/
```

Provides the QR scanning interface for verification and related processes.

---

## 🗄️ Database

TRAMS uses a backend database to store and manage application data.

### Database Configuration

Configure your database connection through environment variables rather than hard-coding credentials into the source code.

Example:

```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=trams
```

> Replace the example values with your actual local database configuration.

---

## 🔒 Security

The following files and information should **not** be committed to the repository:

```text
.env
.env.local
node_modules/
```

Sensitive information such as:

* Database passwords
* API keys
* Authentication secrets
* Private credentials

should always be stored in environment variables.

---

## 📸 Screenshots

Add screenshots of the application here to showcase the project.

### Login Page

> Add screenshot here.

### Admin Dashboard

> Add screenshot here.

### Super Admin

> Add screenshot here.

### QR Scanner

> Add screenshot here.

Example:

```markdown
![TRAMS Login Page](Frontend/Assets/TRAMS_1.jpg)
```

---

## 🧪 Testing

Before running the application, make sure:

* [ ] Backend dependencies are installed
* [ ] Database is running
* [ ] Database credentials are configured
* [ ] Required environment variables are present
* [ ] Backend server starts successfully
* [ ] Frontend pages load correctly
* [ ] Login functionality works
* [ ] Admin functionality works
* [ ] Super Admin functionality works
* [ ] QR scanner functionality works

---

## 🛣️ Future Improvements

Potential future improvements include:

* [ ] Improved authentication and authorization
* [ ] Enhanced dashboard analytics
* [ ] Improved QR verification workflow
* [ ] Responsive design improvements
* [ ] More comprehensive error handling
* [ ] Automated testing
* [ ] Deployment to a production environment
* [ ] Improved documentation
* [ ] API documentation

---

## 📚 Learning Objectives

This project demonstrates practical experience with:

* Full-stack web development
* Frontend development
* Backend development
* REST/API-based communication
* Database integration
* User authentication
* Role-based system design
* QR code functionality
* Git and GitHub
* Project organization and version control

---

## 👨‍💻 Author

**Adrian Paul**

GitHub:
https://github.com/pollyarium13

---

## 📄 License

This project is currently intended for educational and development purposes.

If you plan to distribute or deploy this project publicly, consider adding an appropriate open-source license.

---

## ⭐ Acknowledgements

Thank you to everyone who contributed to the development, testing, and improvement of the TRAMS project.

---

**TRAMS — Transportation Registration and Management System**
