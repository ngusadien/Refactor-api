import User from '../models/user.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import crypto from 'crypto';
import { sendPasswordResetEmail, sendOTPEmail } from '../utils/email.js';

// Helper to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper to generate reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Register
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      otp: {
        code: otp,
        expiresAt: otpExpiry,
      },
    });

    // Send OTP via Email
    try {
      await sendOTPEmail(email, otp);
      console.log(`OTP email sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Continue even if email fails, user can resend
    }

    res.status(201).json({
      message: 'Registration successful. Please verify your OTP.',
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP
export const verifyOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.otp || user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const accessToken = generateAccessToken({ userId: user._id });
    const refreshToken = generateRefreshToken({ userId: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: 'OTP verified successfully',
      accessToken,
      refreshToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log("here 1")

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
      console.log("here 2")
    }

    // const isValidPassword = await user.comparePassword(password);
    // if (!isValidPassword) {
    //   return res.status(400).json({ message: 'Invalid credentials' });
    // }

    // if (!user.isVerified) {
    //   return res.status(401).json({ message: 'Please verify your account' });
    // }

    const accessToken = generateAccessToken({ userId: user._id });
    const refreshToken = generateRefreshToken({ userId: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    const userObj = user.toJSON();

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Token
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const newAccessToken = generateAccessToken({ userId: user._id });
    const newRefreshToken = generateRefreshToken({ userId: user._id });

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// Logout
export const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.refreshToken = undefined;
    await user.save();

    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};

// Forgot Password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal if the email exists or not
      return res.json({
        message: 'If that email exists in our system, you will receive a password reset link shortly.'
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpiry;
    await user.save();

    // Send email with reset link
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(email, resetUrl);
      console.log(`Password reset email sent to ${email}`);

      res.json({
        message: 'Password reset link has been sent to your email.',
        // Include token in development only (remove in production)
        ...(process.env.NODE_ENV === 'development' && { token: resetToken, resetUrl })
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Clean up the reset token since email failed
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(500).json({
        message: 'Failed to send password reset email. Please try again later.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Reset Password
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
};
