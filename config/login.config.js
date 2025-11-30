export const loginConfigs = {
  g05: {
    baseURL: 'https://ivm108.informatik.htw-dresden.de/ewa24tests/g05/EWA_Beleg_24/#/',
    selectors: {
      // Login button/link
      loginButton: 'button:has(i.fa-login)',
      loginIcon: 'i.fa-login',
      
      // Login modal/popup
      loginModal: '.modal', // Bootstrap modal
      loginForm: 'form', // Or specific form selector
      
      // Form fields
      emailInput: 'input[type="email"]',
      passwordInput: 'input[type="password"]',
      usernameInput: 'input[type="text"][placeholder*="user"], input[name="username"]',
      
      // Buttons
      submitButton: 'button[type="submit"]:has-text("Anmelden"), button:has-text("Login")',
      registerButton: 'button:has-text("Registrieren"), a:has-text("Registrieren")',
      closeModal: 'button:has(i.fa-x), .modal-header button.close',
      
      // Messages
      errorMessage: '.alert-danger, .text-danger, [role="alert"]',
      successMessage: '.alert-success, .text-success',
      
      // Navigation
      logoutButton: 'button:has-text("Logout"), a:has-text("Logout")',
      accountMenu: 'button:has(i.fa-user), .user-menu',
    },
    text: {
      login: 'Anmelden',
      register: 'Registrieren',
      logout: 'Logout',
      invalidCredentials: 'Benutzername oder Passwort falsch',
      loginSuccess: 'erfolgreich angemeldet',
    },
    credentials: {
      validUser: {
        email: 'test@example.com',
        password: 'password123'
      },
      invalidUser: {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      }
    },
    features: {
      hasModal: true,
      hasRegisterLink: true,
      emailBased: true,
      rememberMe: true,
    }
  },
  
  g31: {
    baseURL: 'https://ivm108.informatik.htw-dresden.de/ewa/g31/Beleg/',
    selectors: {
      // This simple Vue app doesn't have a login modal visible in the source
      // But you can add it here if there's a login page
      loginButton: null,
      loginModal: null,
      emailInput: 'input[type="email"]',
      passwordInput: 'input[type="password"]',
      submitButton: 'button[type="submit"]',
      errorMessage: '.alert-danger, [role="alert"]',
      successMessage: '.alert-success',
      logoutButton: null,
    },
    text: {
      login: 'Login',
      invalidCredentials: 'Invalid credentials',
    },
    credentials: {
      validUser: {
        email: 'test@example.com',
        password: 'password123'
      }
    },
    features: {
      hasModal: false,
      hasRegisterLink: false,
      emailBased: true,
    }
  }
};
