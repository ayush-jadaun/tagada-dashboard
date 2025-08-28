# Tagada-AI 🤖📞

An intelligent AI-powered debt collection service that automates phone calls to defaulters using advanced voice AI technology.

## 📋 Overview

Tagada-AI is a comprehensive debt collection platform that allows companies and organizations to:

- Upload CSV files containing defaulter information
- Create and manage collection campaigns
- Automatically call defaulters using AI voice agents
- Track call results, success rates, and campaign performance
- Generate detailed summaries and evaluations

## ✨ Features

- **CSV Upload & Processing**: Import defaulter data with columns for name, amount owed, and phone number
- **Campaign Management**: Create and organize multiple collection campaigns
- **AI Voice Calls**: Automated phone calls powered by VAPI (Voice AI Platform)
- **Real-time Dashboard**: Monitor campaign progress and call results
- **Success Metrics**: Track payment recovery rates and call effectiveness
- **Company Management**: Multi-tenant support for different organizations
- **Admin Panel**: Secure admin access for platform management

## 🛠️ Technology Stack

- **Frontend & Backend**: Next.js (React framework)
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: Cloudinary for CSV and media file management
- **Voice AI**: VAPI for automated phone calls
- **Authentication**: Custom admin authentication system

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- MongoDB Atlas account (or local MongoDB instance)
- Cloudinary account
- VAPI account with API access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/tagada-ai.git
   cd tagada-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   
   Create a `.env.local` file in the root directory and add the following environment variables:

   ```env
   # Cloudinary Configuration (for file storage)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # MongoDB Configuration
   MONGODB_URI=your_mongodb_connection_string

   # VAPI Configuration (Voice AI Platform)
   # You'll need to set up both VAPI and Twilio accounts
   VAPI_API_KEY=your_vapi_api_key
   VAPI_ASSISTANT_ID=your_vapi_assistant_id
   VAPI_PHONE_NUMBER_ID=your_twilio_phone_number_connected_to_vapi

   # Admin Authentication
   ADMIN_ID=your_admin_username
   ADMIN_PASSWORD=your_admin_password
   ```

### Setting up Services

#### MongoDB Atlas
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string and replace `MONGODB_URI`

#### Cloudinary
1. Sign up for Cloudinary
2. Get your cloud name, API key, and API secret from the dashboard
3. Update the Cloudinary environment variables

#### VAPI (Voice AI Platform) & Twilio Setup
1. **Create a VAPI account** at [vapi.ai](https://vapi.ai)
2. **Set up Twilio Phone Number**:
   - Create a Twilio account at [twilio.com](https://twilio.com)
   - Purchase a phone number (required for calling any phone numbers)
   - **Note**: The development version used a free Twilio number which only allows calling verified phone numbers
   - For production use, you'll need a paid Twilio phone number to call any phone numbers
3. **Configure VAPI Assistant**:
   - Create an AI assistant in your VAPI dashboard
   - Connect your Twilio phone number to VAPI
   - Configure the assistant's voice and conversation flow
4. **Get your credentials**:
   - VAPI API Key from your VAPI dashboard
   - VAPI Assistant ID (created in step 3)
   - VAPI Phone Number ID (your connected Twilio number)

### Running the Application

1. **Development mode**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Production build**
   ```bash
   npm run build
   npm start
   # or
   yarn build
   yarn start
   ```

3. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - Admin panel: `http://localhost:3000/admin`

## 📊 How It Works

### For Companies/Organizations:

1. **Company Registration**: Create a company profile on the platform
2. **CSV Upload**: Upload a CSV file containing defaulter information with columns:
   - `name`: Defaulter's full name
   - `amount_owed`: Outstanding debt amount
   - `phone_number`: Contact phone number
3. **Campaign Creation**: Set up collection campaigns with specific parameters
4. **AI Calling**: The system automatically calls each defaulter using AI voice agents
5. **Results Tracking**: Monitor call outcomes, success rates, and payment recoveries

### CSV Format Requirements:

```csv
name,amount_owed,phone_number
John Doe,1500.00,+1234567890
Jane Smith,2300.50,+0987654321
Bob Johnson,850.75,+1122334455
```

## ⚠️ Important Setup Notes

### Phone Calling Limitations
- **Development vs Production**: This project was developed using a **free Twilio phone number**, which has limitations
- **Free Twilio Number**: Can only call phone numbers that have been verified in your Twilio console
- **Production Use**: You'll need to **purchase a paid Twilio phone number** to call any phone numbers without verification
- **Cost Consideration**: Each call will incur Twilio charges, so factor this into your pricing model

### VAPI + Twilio Integration
- VAPI handles the AI conversation logic
- Twilio provides the actual phone calling infrastructure  
- Both services need to be properly connected for the system to work

### Dashboard Analytics
- **Success Evaluation**: Track percentage of successful debt recoveries
- **Call Summaries**: Detailed reports of each call interaction
- **Campaign Performance**: Monitor overall campaign effectiveness
- **Payment Tracking**: Record and track payment commitments

### AI Voice Agent
- Natural language processing for human-like conversations
- Customizable scripts for different debt collection scenarios
- Automatic call scheduling and retry mechanisms
- Real-time call monitoring and recording

## 🔐 Security

- Secure admin authentication system
- Environment variable protection for sensitive API keys
- Data encryption for customer information
- GDPR-compliant data handling

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation for common troubleshooting steps

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add all environment variables in the Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. Build the application: `npm run build`
2. Upload the `.next` folder and dependencies to your server
3. Set up environment variables on your hosting platform
4. Start the application: `npm start`

---

**Made with ❤️ for efficient debt collection management**