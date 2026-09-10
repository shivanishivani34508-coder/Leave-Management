# Leave Management System

A full-stack Leave Management System built using the MERN stack.

The system helps organizations manage employee leave applications, approvals, leave balances, holidays, and reports through role-based access.

## Features

- Employee leave application
- Full-day and half-day leave
- Leave balance management
- Manager approval
- Department Head approval
- HR approval
- Admin final approval
- Holiday management
- Automatic holiday exclusion from leave
- Leave balance deduction and restoration
- Yearly leave balances
- Carry-forward leave
- Employee management
- Department management
- Notifications
- Leave reports
- Role-based authentication and authorization

## Technology Stack

### Frontend

- React.js
- React Router
- Axios
- Bootstrap
- CSS
- React Calendar

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt
- Nodemailer

## Project Structure

```text
leave-management-system/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── assets/
│   ├── package.json
│   └── package-lock.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── seed/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
├── package.json
└── README.md