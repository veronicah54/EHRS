# Emergency Response and Healthcare Appointments System

A comprehensive web-based application that integrates emergency response capabilities with routine healthcare appointment management, providing users with immediate medical assistance and seamless healthcare coordination.

## 🚀 Features

### Emergency Response
- **Real-time Emergency Requests**: Submit emergency requests with location tracking
- **Ambulance Dispatch**: Automatic assignment of nearest available ambulances
- **Live Tracking**: Real-time ambulance location updates
- **Priority-based Response**: Intelligent priority calculation based on emergency type and severity
- **Multi-role Coordination**: Seamless communication between patients, responders, and medical staff

### Healthcare Appointments
- **Easy Booking**: Simple appointment scheduling with available doctors
- **Doctor Search**: Find doctors by specialization, location, and availability
- **Appointment Management**: Reschedule, cancel, or modify appointments
- **Automated Reminders**: Email and SMS notifications for upcoming appointments
- **Medical Records**: Secure storage of patient medical history and prescriptions

### User Management
- **Role-based Access**: Different interfaces for patients, doctors, admins, and emergency responders
- **Secure Authentication**: JWT-based authentication with password encryption
- **Profile Management**: Comprehensive user profiles with medical information
- **Real-time Notifications**: Socket.io powered live updates and alerts

### Administrative Features
- **Dashboard Analytics**: Comprehensive statistics and reporting
- **User Management**: Admin controls for user verification and management
- **Emergency Monitoring**: Real-time emergency response tracking
- **System Configuration**: Configurable system settings and parameters

## 🛠 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation

### Frontend
- **React** - User interface library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications
- **Heroicons** - Icon library

### Additional Tools
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection
- **Nodemailer** - Email notifications

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn** package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd emergency-healthcare-system
```

### 2. Install Dependencies
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
```

Required environment variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/emergency_healthcare
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
CLIENT_URL=http://localhost:3000
```

### 4. Database Setup
```bash
# Start MongoDB service
# On Windows: net start MongoDB
# On macOS: brew services start mongodb-community
# On Linux: sudo systemctl start mongod

# Seed the database with sample data
node server/seeds/seedData.js
```

### 5. Start the Application
```bash
# Development mode (runs both server and client)
npm run dev

# Or run separately:
# Terminal 1 - Server
npm run server

# Terminal 2 - Client
npm run client
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 👥 Demo Accounts

After seeding the database, you can use these demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@demo.com | password123 |
| Doctor | doctor@demo.com | password123 |
| Admin | admin@demo.com | password123 |
| Emergency Responder | responder1@demo.com | password123 |

## 🏗 Project Structure

```
emergency-healthcare-system/
├── server/                 # Backend application
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── seeds/             # Database seeding
│   └── server.js          # Server entry point
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── App.js         # Main app component
│   └── public/            # Static assets
├── package.json           # Root package.json
└── README.md             # Project documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Appointments
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Book appointment
- `PATCH /api/appointments/:id/status` - Update appointment status
- `PATCH /api/appointments/:id/reschedule` - Reschedule appointment

### Emergency
- `POST /api/emergency` - Create emergency request
- `GET /api/emergency` - Get emergency requests
- `PATCH /api/emergency/:id/status` - Update emergency status
- `PATCH /api/emergency/:id/assign-ambulance` - Assign ambulance

### Doctors
- `GET /api/doctors` - Get doctors list
- `GET /api/doctors/:id` - Get doctor details
- `POST /api/doctors/:id/reviews` - Add doctor review

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt password encryption
- **Input Validation** - Express validator for data validation
- **Rate Limiting** - Protection against brute force attacks
- **CORS Configuration** - Controlled cross-origin requests
- **Helmet Security** - Security headers and protection
- **Role-based Access** - Granular permission system

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📱 Features by User Role

### Patients
- Register and manage profile
- Book, reschedule, cancel appointments
- Submit emergency requests
- Track ambulance location
- View medical history
- Rate and review doctors

### Doctors
- Manage professional profile
- View and manage appointments
- Update appointment status
- Add medical notes and prescriptions
- Set availability schedule
- Emergency response participation

### Emergency Responders
- View active emergencies
- Update emergency status
- Track ambulance locations
- Manage response history
- Coordinate with medical teams

### Administrators
- User management and verification
- System analytics and reporting
- Emergency response monitoring
- Doctor verification
- System configuration

## 🌟 Key Highlights

### Real-time Features
- Live emergency notifications
- Ambulance location tracking
- Appointment status updates
- System-wide messaging

### Data Validation
- Comprehensive input validation
- Date and time validation
- Medical data verification
- Location coordinate validation

### User Experience
- Responsive design for all devices
- Intuitive navigation
- Real-time feedback
- Accessibility compliance

### Scalability
- Modular architecture
- Database indexing
- Efficient queries
- Caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
**Emergency Hotline: 911**  
*For immediate medical emergencies, always call emergency services first.*