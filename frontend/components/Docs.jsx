import Markdown from 'react-markdown';

export default function Docs() {
  const mdText = `
# Documentation

## About
**Getaway** is a lightweight API gateway built with **Rust**, powered by **Tokio** and **Hyper**. It sits between your client and server, handling:

- Routing requests  
- Authentication  
- Request timeouts  
- Response caching  

The gateway is configurable through a **React-based dashboard**, making integration into your project simple.  

> Designed to be **self-hosted locally**

---

## Prerequisites
Before running Getaway, make sure the following are installed:

- [Rust and Cargo](https://www.rust-lang.org/tools/install)  
- [Node.js](https://nodejs.org/) and npm  

## Project Structure

Getaway is split into three components:

\`\`\`
getaway/
├── gateway/
├── policy/
└── frontend/
\`\`\`

- **Gateway** – Handles API requests and routing  
- **Policy Engine** – Enforces routing rules and policies  
- **Dashboard** – React frontend for configuring and monitoring the gateway

---

## Installation

### 1. Clone the repository and navigate to the project directory
\`\`\`
git clone https://github.com/Ojas2217/Getaway.git
cd getaway
\`\`\`

### 2. Install frontend dependencies
\`\`\`
cd frontend
npm install
\`\`\`

### 3. Configure environment variables
The .env file in the project root consists of the following variables with their default values:
\`\`\`
GATEWAY_ADDR=127.0.0.1:8080
POLICY_ADDR=127.0.0.1:4000
DASHBOARD_ADDR=127.0.0.1:5173
\`\`\`

You can configure these values to host the application on different addresses.

### 4. Start all services by running the powershell script
\`\`\`
./getaway.sh
\`\`\`

### 5. Navigate to \`DASHBOARD_ADDR\` to access your dashboard
From the dashboard, you can:
- View and edit gateway policies
- Monitor logs

> **Note:** All services must be running for the gateway to function correctly.
`;

  return (
    <div className="md p-6 text-[#693f39] space-y-6 text-2xl a ">
      <Markdown>{mdText}</Markdown>
    </div>
  );
}
