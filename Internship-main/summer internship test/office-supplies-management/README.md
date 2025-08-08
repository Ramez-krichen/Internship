# Office Supplies Management System

A comprehensive web application for managing office supplies, requests, inventory, and purchase orders. Built with modern technologies to streamline procurement processes and improve operational efficiency.

## 🚀 Features

### Core Functionality
- **Request Management**: Create, track, and approve supply requests with multi-level approval workflows
- **Inventory Management**: Real-time stock tracking with automated low-stock alerts
- **Supplier Management**: Comprehensive supplier database with performance tracking
- **Purchase Orders**: Complete order lifecycle from creation to delivery
- **Reports & Analytics**: Detailed spending analysis and consumption insights
- **User Management**: Role-based access control with Admin, Manager, and Employee roles

### Technical Features
- **Modern UI**: Responsive design with Tailwind CSS
- **Real-time Updates**: Live data synchronization
- **Security**: JWT authentication with bcrypt password hashing
- **Type Safety**: Full TypeScript implementation
- **Database**: SQLite for development, PostgreSQL ready for production
- **API**: RESTful API with comprehensive error handling

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: NextAuth.js with JWT
- **UI Components**: Lucide React icons, custom components
- **Development**: ESLint, TypeScript, Git

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd office-supplies-management
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Initialize Database
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## 🔐 Demo Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@example.com | admin123 | Full system access |
| Manager | manager@example.com | manager123 | Department management |
| Employee | employee@example.com | employee123 | Request creation only |

## 📁 Project Structure

```
office-supplies-management/
├── docs/                          # Documentation
│   ├── CONCEPTION.md              # System conception
│   ├── ARCHITECTURE_DIAGRAMS.md   # Architecture diagrams
│   ├── TECHNICAL_SPECIFICATIONS.md # Technical specs
│   ├── PROJECT_PLAN.md            # Project roadmap
│   ├── USER_MANUAL.md             # User guide
│   └── uml/                       # UML Diagrams
│       ├── sequence-diagram-request-approval.drawio
│       ├── class-diagram-domain-model.drawio
│       ├── use-case-diagram-system-overview.drawio
│       └── UML_DIAGRAMS_DOCUMENTATION.md
├── prisma/                        # Database schema
│   └── schema.prisma              # Prisma schema
├── scripts/                       # Utility scripts
│   └── seed.ts                    # Database seeding
├── src/                           # Source code
│   ├── app/                       # Next.js app directory
│   │   ├── api/                   # API routes
│   │   ├── auth/                  # Authentication pages
│   │   ├── dashboard/             # Dashboard page
│   │   ├── requests/              # Request management
│   │   ├── inventory/             # Inventory management
│   │   ├── suppliers/             # Supplier management
│   │   ├── orders/                # Purchase orders
│   │   ├── reports/               # Reports & analytics
│   │   ├── users/                 # User management
│   │   └── settings/              # System settings
│   ├── components/                # React components
│   │   ├── layout/                # Layout components
│   │   └── providers/             # Context providers
│   ├── lib/                       # Utility libraries
│   │   ├── auth.ts                # Authentication config
│   │   ├── db.ts                  # Database connection
│   │   └── utils.ts               # Helper functions
│   └── types/                     # TypeScript definitions
└── public/                        # Static assets
```

## 🗄️ Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Users**: Authentication and role management
- **Suppliers**: Supplier information and relationships
- **Categories**: Item categorization hierarchy
- **Items**: Product catalog with stock tracking
- **Requests**: Supply requests with approval workflow
- **PurchaseOrders**: Order management and tracking
- **Approvals**: Multi-level approval system
- **StockMovements**: Inventory transaction history

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:seed      # Seed database with demo data
npm run db:reset     # Reset and reseed database
npx prisma studio    # Open Prisma Studio
npx prisma generate  # Generate Prisma client
```

## 🚀 Deployment

### Environment Variables
```bash
# Database
DATABASE_URL="your-database-url"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="your-app-url"

# Application
APP_NAME="Office Supplies Management"
APP_VERSION="1.0.0"
```

### Production Deployment
1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set up production database**:
   - Configure PostgreSQL database
   - Update DATABASE_URL in environment
   - Run migrations: `npx prisma db push`

3. **Deploy to hosting platform**:
   - Vercel (recommended)
   - Netlify
   - AWS/Azure/GCP
   - Docker container

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Conception Document](docs/CONCEPTION.md)**: System overview and architecture
- **[Architecture Diagrams](docs/ARCHITECTURE_DIAGRAMS.md)**: Visual system architecture
- **[Technical Specifications](docs/TECHNICAL_SPECIFICATIONS.md)**: Detailed technical requirements
- **[Project Plan](docs/PROJECT_PLAN.md)**: Development roadmap and milestones
- **[User Manual](docs/USER_MANUAL.md)**: Complete user guide

### UML Diagrams

Professional UML diagrams created with draw.io are available in the `docs/uml/` directory:

- **[Sequence Diagram](docs/uml/sequence-diagram-request-approval.drawio)**: Request approval workflow
- **[Class Diagram](docs/uml/class-diagram-domain-model.drawio)**: Domain model with entities and relationships
- **[Use Case Diagram](docs/uml/use-case-diagram-system-overview.drawio)**: System functionality by user roles
- **[UML Documentation](docs/uml/UML_DIAGRAMS_DOCUMENTATION.md)**: Comprehensive diagram explanations

The UML diagrams follow standard UML 2.5 notation and provide multiple perspectives of the system:
- **Behavioral View**: Sequence diagrams showing interactions and workflows
- **Structural View**: Class diagrams showing entities, attributes, and relationships
- **Functional View**: Use case diagrams showing system capabilities by user role

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [User Manual](docs/USER_MANUAL.md)
- Review [Technical Specifications](docs/TECHNICAL_SPECIFICATIONS.md)
- Open an issue on GitHub
- Contact the development team

## 🎯 Roadmap

### Phase 1 (Completed)
- [x] Core authentication and authorization
- [x] Request management with approval workflow
- [x] Inventory management with stock tracking
- [x] Supplier and purchase order management
- [x] Basic reporting and analytics
- [x] User management and settings

### Phase 2 (Future)
- [ ] Advanced reporting with charts and graphs
- [ ] Email notifications and alerts
- [ ] File upload and attachment management
- [ ] Mobile application
- [ ] API integrations (ERP systems)
- [ ] Advanced approval workflows
- [ ] Audit trail and compliance features

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies.**
