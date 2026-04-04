import type { Request, Response } from "express";

import {
  loginUser,
  requestPasswordReset,
  resetPasswordWithOtp,
  signupUser
} from "../services/auth.service.js";

function getCredentials(request: Request) {
  const { email, password } = request.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return null;
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  return { email, password };
}

function getSignupRole(request: Request) {
  const { role } = request.body as {
    role?: string;
  };

  if (role !== "admin" && role !== "candidate" && role !== "student") {
    throw new Error("Role must be student or admin");
  }

  return role;
}

export async function signup(request: Request, response: Response) {
  try {
    const credentials = getCredentials(request);

    if (!credentials) {
      return response.status(400).json({
        message: "Email and password are required"
      });
    }

    const result = await signupUser({
      ...credentials,
      role: getSignupRole(request)
    });

    return response.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed";

    return response.status(400).json({ message });
  }
}

export async function login(request: Request, response: Response) {
  try {
    const credentials = getCredentials(request);

    if (!credentials) {
      return response.status(400).json({
        message: "Email and password are required"
      });
    }

    const result = await loginUser(credentials);

    return response.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";

    return response.status(401).json({ message });
  }
}

export async function requestForgotPassword(request: Request, response: Response) {
  try {
    const { email } = request.body as {
      email?: string;
    };

    if (!email) {
      return response.status(400).json({
        message: "Email is required"
      });
    }

    const result = await requestPasswordReset(email);

    return response.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to request password reset";

    return response.status(400).json({ message });
  }
}

export async function resetForgotPassword(request: Request, response: Response) {
  try {
    const { email, otp, newPassword } = request.body as {
      email?: string;
      otp?: string;
      newPassword?: string;
    };

    if (!email || !otp || !newPassword) {
      return response.status(400).json({
        message: "Email, OTP, and newPassword are required"
      });
    }

    if (newPassword.length < 6) {
      return response.status(400).json({
        message: "Password must be at least 6 characters long"
      });
    }

    const result = await resetPasswordWithOtp({
      email,
      otp,
      newPassword
    });

    return response.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password reset failed";

    return response.status(400).json({ message });
  }
}
