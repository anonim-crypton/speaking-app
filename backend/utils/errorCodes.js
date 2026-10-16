/**
 * Machine-readable codes for API error messages.
 *
 * The backend only speaks English; the frontend translates the `code` into the
 * language the visitor picked on the site (see frontend/src/i18n/messages.ts).
 */
const EXACT = {
  "Name is required": "NAME_REQUIRED",
  "A valid email is required": "EMAIL_INVALID",
  "Password must be at least 6 characters": "PASSWORD_SHORT",
  "This email is already registered": "EMAIL_TAKEN",
  "Registration failed": "REGISTER_FAILED",
  "Enter a valid phone number": "PHONE_INVALID",
  "Invalid phone number": "PHONE_INVALID",
  "This phone number is already registered": "PHONE_TAKEN",
  "A valid Google email is required": "GOOGLE_EMAIL_INVALID",
  "Invalid Google credential": "GOOGLE_CREDENTIAL_INVALID",
  "Could not verify Google token": "GOOGLE_TOKEN_UNVERIFIED",
  "Google sign-in failed": "GOOGLE_FAILED",
  "Email and password are required": "CREDENTIALS_REQUIRED",
  "Incorrect email": "EMAIL_WRONG",
  "Incorrect password": "PASSWORD_WRONG",
  "This account was created with Google": "GOOGLE_ACCOUNT",
  "Login failed": "LOGIN_FAILED",
  "Could not send the code": "OTP_SEND_FAILED",
  "Code expired — request a new one": "OTP_EXPIRED",
  "Too many attempts — request a new code": "OTP_TOO_MANY",
  "Incorrect code": "OTP_WRONG",
  "Verification failed": "VERIFY_FAILED",
  "Enter a valid age": "AGE_INVALID",
  "Enter your name": "NAME_INVALID",
  "Username must be at least 5 characters": "USERNAME_TOO_SHORT",
  "Username can only contain letters, numbers, _ and .": "USERNAME_INVALID",
  "This username is already taken": "USERNAME_TAKEN",
  "Phone number is not registered": "PHONE_NOT_REGISTERED",
  "Select a country": "COUNTRY_REQUIRED",
  "Select a purpose": "PURPOSE_REQUIRED",
  "Select an option": "GENDER_REQUIRED",
  "Could not save your answers": "ONBOARDING_FAILED",
  "Authentication required": "AUTH_REQUIRED",
  "User not found": "AUTH_REQUIRED",
  "Invalid or expired token": "AUTH_REQUIRED",
  "Route not found": "NOT_FOUND",
  "Internal server error": "SERVER_ERROR",
};

function codeFor(message) {
  if (typeof message !== "string") return undefined;
  if (EXACT[message]) return EXACT[message];
  if (/^Wait \d+s before requesting a new code/.test(message)) return "OTP_WAIT";
  return undefined;
}

/** Adds a `code` field to every `{ success: false }` JSON response. */
function errorCodes(req, res, next) {
  const json = res.json.bind(res);
  res.json = (body) => {
    if (body && body.success === false && !body.code) {
      const code = codeFor(body.message);
      if (code) body = { ...body, code };
    }
    return json(body);
  };
  next();
}

module.exports = { errorCodes, codeFor };
