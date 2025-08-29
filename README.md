# University Bus Management System

A modern, full-stack bus management system built with Next.js, React, TypeScript, and JSON Server.

## 🚀 Features

- **Multi-role User Management**: Admin, Student, Driver, Supervisor, Movement Manager
- **Real-time Bus Tracking**: Live location monitoring with Mapbox integration
- **Route Management**: Comprehensive route planning and scheduling
- **Payment System**: Student subscription and payment tracking
- **Analytics Dashboard**: Real-time statistics and performance metrics
- **Modern UI**: Clean, responsive design with Tailwind CSS

## 🏗️ Architecture

### Frontend
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Chart.js** for data visualization
- **Mapbox GL** for mapping

### Backend
- **JSON Server** for RESTful API
- **Unified Data Source**: Single `db.json` file with all system data
- **Real-time Updates**: Automatic data synchronization

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Role-based dashboards
│   │   ├── admin/         # Admin dashboard
│   │   ├── student/       # Student dashboard
│   │   ├── driver/        # Driver dashboard
│   │   ├── supervisor/    # Supervisor dashboard
│   │   └── movement-manager/ # Movement manager dashboard
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── charts/           # Chart components
│   ├── layout/           # Layout components
│   └── maps/             # Map components
├── lib/                  # Utilities and API services
│   ├── api.ts            # Unified API service layer
│   └── constants.ts      # System constants
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd busSystem2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local file
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
   ```

4. **Start the development servers**
   ```bash
   # Option 1: Run both servers simultaneously
   npm run dev:full
   
   # Option 2: Run servers separately
   npm run json-server    # Backend API (port 3001)
   npm run dev           # Frontend (port 3000)
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@university.edu | password123 |
| Student | alex.chen@student.university.edu | password123 |
| Driver | mike.thompson@university.edu | password123 |
| Supervisor | david.wilson@university.edu | password123 |
| Movement Manager | jennifer.lee@university.edu | password123 |

## 📊 Data Structure

### Users
- **Students**: Assigned to buses, routes, and supervisors
- **Drivers**: Assigned to specific buses and routes
- **Supervisors**: Manage students and monitor trips
- **Movement Managers**: Fleet and route management
- **Admins**: Full system access

### Core Entities
- **Buses**: Vehicle management with real-time tracking
- **Routes**: Transportation paths with schedules
- **Trips**: Individual journey instances
- **Payments**: Student subscription management
- **Bookings**: Seat reservations and confirmations

## 🔌 API Endpoints

### Base URL: `http://localhost:3001`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users` | GET | Get all users |
| `/users?role=student` | GET | Get users by role |
| `/buses` | GET | Get all buses |
| `/routes` | GET | Get all routes |
| `/trips` | GET | Get all trips |
| `/payments` | GET | Get all payments |
| `/bookings` | GET | Get all bookings |
| `/notifications` | GET | Get all notifications |
| `/attendance` | GET | Get attendance records |
| `/announcements` | GET | Get system announcements |
| `/analytics` | GET | Get analytics data |

## 🔄 Data Flow

### 1. **Unified Data Source**
- All data comes from `db.json` via JSON Server
- No more static mock data or inconsistent sources
- Real-time data synchronization across all components

### 2. **Role-Based Access**
- **Admin**: Full access to all data and management functions
- **Student**: View assigned bus, route, driver, and supervisor
- **Driver**: Access to assigned bus, route, and student list
- **Supervisor**: Monitor assigned students and trips
- **Movement Manager**: Fleet and route analytics

### 3. **Navigation Flow**
```
Login → Role Detection → Dashboard Redirect
├── Admin → Global Management Dashboard
├── Student → Personal Trip & Payment Dashboard
├── Driver → Route & Student Management
├── Supervisor → Student Monitoring Dashboard
└── Movement Manager → Fleet Analytics Dashboard
```

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Responsive Layout**: Mobile-first design approach
- **Interactive Charts**: Real-time data visualization
- **Live Maps**: Real-time bus tracking
- **Toast Notifications**: User feedback system
- **Loading States**: Smooth user experience

## 🛠️ Development

### Adding New Features
1. Update types in `src/types/`
2. Add API endpoints in `src/lib/api.ts`
3. Create UI components in `src/components/`
4. Update pages in `src/app/dashboard/`

### Data Modifications
1. Update `db.json` structure
2. Modify API service functions
3. Update TypeScript interfaces
4. Test with JSON Server

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # If port 3001 is busy
   npm run json-server -- --port 3002
   ```

2. **API Connection Errors**
   - Ensure JSON Server is running
   - Check `http://localhost:3001` in browser
   - Verify API base URL in `src/lib/api.ts`

3. **TypeScript Errors**
   ```bash
   npm run lint
   # Fix type issues in components
   ```

## 📈 Performance

- **Lazy Loading**: Components load on demand
- **Optimized Images**: Next.js image optimization
- **Efficient State Management**: React hooks with proper dependencies
- **API Caching**: Intelligent data fetching strategies

## 🔒 Security Considerations

- **Role-based Access Control**: User permissions enforced
- **Input Validation**: Form data sanitization
- **API Rate Limiting**: JSON Server configuration
- **Environment Variables**: Sensitive data protection

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
- Set production API endpoints
- Configure Mapbox access tokens
- Set up production database

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review API documentation

---

**Built with ❤️ using Next.js, React, and TypeScript**
