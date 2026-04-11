# Architecture of FinnaRenewer

## Overview
FinnaRenewer is a Go-based application designed to automate the renewal of library loans from the Oulu Finna library system. The application can be run locally in a terminal or scheduled to execute periodically using GitHub Actions.

## Components

### 1. Main Application
- **main.go**: The entry point of the application. It initializes the application, sets up routes, and starts the server if needed.

### 2. Authentication
- **login.go**: Handles user authentication and login functionality. This includes:
  - Validating user credentials.
  - Generating tokens.
  - Managing user sessions.

### 3. Loan Management
- **loans.go**: Manages loan-related functionality, such as:
  - Retrieving loan information.
  - Renewing loans.
  - Managing loan records.

### 4. Renewal Process
- **renew.go**: Handles the renewal process, including:
  - Validating renewal requests.
  - Updating loan records.
  - Managing renewal history.

### 5. Notifications
- **notify.go**: Manages notifications, including:
  - Sending email notifications.
  - Managing notification preferences.
  - Scheduling notifications.

## Supporting Files

### Configuration
- **.env**: Contains environment variables such as API keys and database credentials. This file is excluded from version control for security reasons.

### Dependency Management
- **go.mod**: Specifies the module path and dependencies for the project.
- **go.sum**: Contains checksums for the dependencies to ensure integrity.

### Reverse Engineering
- **Reverse-engineering/**: Contains reference files such as HTML code for the authentication page and login XHR requests. These are used for understanding the library's system but are not directly part of the application logic.

## Deployment Options

### 1. Local Execution
The application can be run locally in a terminal. This is useful for testing and one-time renewals.

### 2. Scheduled Execution with GitHub Actions
The application can be scheduled to run periodically using GitHub Actions. This ensures that loans are renewed automatically without manual intervention.

## Future Enhancements
- Add support for additional library systems.
- Implement a web-based user interface for easier configuration and monitoring.
- Enhance logging and error reporting for better debugging and monitoring.