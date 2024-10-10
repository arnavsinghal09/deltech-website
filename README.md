# DelTech MUN and Debsoc Website
## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/hospital-vendor-dashboard.git

2. Install dependencies:
    ```bash
    cd web-app
    npm install

3. Set up environment variables in .env:
    ```bash
    # Database URL for Prisma
    DATABASE_URL=postgresql://username:password@localhost:5432/hospital_dashboard
    
    # JWT Secret for authentication
    JWT_SECRET=your_jwt_secret_key
    
    # Nodemailer email configuration
    EMAIL_USER=your-email@gmail.com
    EMAIL_PASS=your-email-password

   # Server Port
    PORT=3000
    
    # Node Environment
    NODE_ENV=development
    ```
4. Run the application:
    ```bash
    npm run dev
---


