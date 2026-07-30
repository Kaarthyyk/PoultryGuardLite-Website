'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Building, Phone, MapPin, Globe, CreditCard, UploadCloud, X } from 'lucide-react';
import { useAuth, AuthError } from '@/contexts/AuthContext';
import { compressAndCropToSquare } from '@/lib/image-utils';

// ── Validation schemas ─────────────────────────────────────────────────────────

const step1Schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters.').max(50),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(100),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

const step2Schema = z.object({
  companyName: z.string().min(1, 'Company Name is required'),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be at most 15 digits')
    .regex(/^\d+$/, 'Phone number must contain only numbers'),
  address: z.string().min(1, 'Address is required'),
  companyEmail: z.string().email('Valid email required').optional().or(z.literal('')),
  website: z.string().url('Valid URL required').optional().or(z.literal('')),
  gstNumber: z.string().optional(),
});

const fullSchema = z.intersection(step1Schema, step2Schema);
type RegisterFormValues = z.infer<typeof fullSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

export function RegisterForm() {
  const { register: authRegister } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Logo state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(fullSchema),
    mode: 'onTouched',
  });

  const handleNext = async () => {
    setAuthError(null);
    const isStep1Valid = await trigger(['name', 'email', 'password', 'confirmPassword']);
    if (isStep1Valid) {
      setStep(2);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Image must be less than 5MB');
      return;
    }
    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setLogoError('Only JPG, PNG, and WEBP formats are supported');
      return;
    }

    setLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (values: RegisterFormValues) => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      let finalLogo: Blob | undefined = undefined;
      
      if (logoFile) {
        try {
          finalLogo = await compressAndCropToSquare(logoFile, 400, 0.85);
        } catch (e) {
          console.error("Failed to compress image, using original", e);
          finalLogo = logoFile;
        }
      }

      await authRegister(
        values.name,
        values.email,
        values.password,
        values.companyName,
        values.phoneNumber,
        values.address,
        values.companyEmail,
        values.website,
        values.gstNumber,
        finalLogo
      );
      
      setSuccess(true);
      // Redirect to dashboard after short delay
      setTimeout(() => router.replace('/home'), 1500);
    } catch (err) {
      if (err instanceof AuthError) {
        setAuthError(err.message);
      } else {
        setAuthError('Something went wrong. Please try again.');
        console.error(err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background pt-12 pb-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(244,169,0,0.25), rgba(46,125,50,0.2))',
              border: '1px solid rgba(244,169,0,0.4)',
            }}
          >
            <span className="text-xl">🐔</span>
          </div>
          <span className="text-lg font-bold" style={{ color: '#F4A900' }}>
            PoultryGuard Lite
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {step === 1 ? 'Personal Information' : 'Company Information'}
          </h2>
          <p className="text-muted-foreground text-sm mb-6 flex justify-between items-center">
            <span>{step === 1 ? 'Start monitoring your flock today.' : 'Tell us about your business.'}</span>
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-semibold border border-primary/30">
              Step {step} of 2
            </span>
          </p>

          {/* Success state */}
          {success && (
            <motion.div
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm mb-5"
              style={{
                background: 'rgba(46,125,50,0.12)',
                border: '1px solid rgba(46,125,50,0.35)',
                color: '#81c784',
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#2E7D32' }} />
              <span>Account created! Redirecting to dashboard…</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Auth error */}
            {authError && (
              <motion.div
                className="flex items-start gap-3 rounded-lg px-4 py-3 text-sm"
                style={{
                  background: 'rgba(183,28,28,0.12)',
                  border: '1px solid rgba(183,28,28,0.3)',
                  color: '#ef9a9a',
                }}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#B71C1C' }} />
                <span>{authError}</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {/* Full name */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="reg-name">Full name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        id="reg-name"
                        type="text"
                        placeholder="Your full name"
                        className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border"
                        style={{ border: errors.name ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties}
                        {...register('name')}
                      />
                    </div>
                    {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="reg-email">Email address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        id="reg-email"
                        type="email"
                        placeholder="you@example.com"
                        className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border"
                        style={{ border: errors.email ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties}
                        {...register('email')}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="reg-password">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 8 characters"
                        className="w-full rounded-xl pl-10 pr-12 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border"
                        style={{ border: errors.password ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties}
                        {...register('password')}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="reg-confirm">Confirm password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        id="reg-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Repeat your password"
                        className="w-full rounded-xl pl-10 pr-12 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border"
                        style={{ border: errors.confirmPassword ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties}
                        {...register('confirmPassword')}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
                  </div>

                  <motion.button
                    type="button"
                    onClick={handleNext}
                    className="w-full py-3 rounded-xl text-sm font-semibold transition-all mt-4"
                    style={{ background: 'linear-gradient(135deg, #F4A900 0%, #d4920a 100%)', color: '#1A1200', boxShadow: '0 4px 20px rgba(244,169,0,0.35)' }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    Next Step
                  </motion.button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Company Name *</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Poultry Farms Ltd."
                        className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50"
                        style={{ border: errors.companyName ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties}
                        {...register('companyName')}
                      />
                    </div>
                    {errors.companyName && <p className="text-xs text-red-400">{errors.companyName.message}</p>}
                  </div>

                  {/* Phone & GST */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="tel"
                          placeholder="1234567890"
                          className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50"
                          style={{ border: errors.phoneNumber ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties}
                          {...register('phoneNumber')}
                        />
                      </div>
                      {errors.phoneNumber && <p className="text-xs text-red-400">{errors.phoneNumber.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">GST / VAT (Optional)</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Tax ID"
                          className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50"
                          style={{ border: '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties}
                          {...register('gstNumber')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="123 Farm Road, Country"
                        className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50"
                        style={{ border: errors.address ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties}
                        {...register('address')}
                      />
                    </div>
                    {errors.address && <p className="text-xs text-red-400">{errors.address.message}</p>}
                  </div>

                  {/* Optional Email and Website */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Company Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="email"
                          placeholder="info@company.com"
                          className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50"
                          style={{ border: errors.companyEmail ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties}
                          {...register('companyEmail')}
                        />
                      </div>
                      {errors.companyEmail && <p className="text-xs text-red-400">{errors.companyEmail.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Website</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="url"
                          placeholder="https://company.com"
                          className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50"
                          style={{ border: errors.website ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties}
                          {...register('website')}
                        />
                      </div>
                      {errors.website && <p className="text-xs text-red-400">{errors.website.message}</p>}
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-sm font-medium text-foreground">Company Logo (Optional)</label>
                    <div className="flex items-center gap-4">
                      {logoPreview ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={logoPreview} alt="Logo preview" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-xl border border-dashed border-primary/50 flex flex-col items-center justify-center bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <UploadCloud className="w-5 h-5 text-primary mb-1" />
                          <span className="text-[10px] text-muted-foreground">Upload</span>
                        </div>
                      )}
                      <div className="flex-1 text-xs text-muted-foreground">
                        <p>JPG, PNG, or WEBP. Max 5MB.</p>
                        <p>Will be cropped to a square.</p>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/jpeg, image/png, image/webp"
                      className="hidden"
                    />
                    {logoError && <p className="text-xs text-red-400">{logoError}</p>}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="py-3 px-4 rounded-xl text-sm font-semibold transition-all bg-background border border-border text-foreground hover:bg-muted"
                    >
                      Back
                    </button>
                    <motion.button
                      type="submit"
                      disabled={isSubmitting || success}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #F4A900 0%, #d4920a 100%)', color: '#1A1200', boxShadow: '0 4px 20px rgba(244,169,0,0.35)' }}
                      whileHover={{ scale: isSubmitting || success ? 1 : 1.01 }}
                      whileTap={{ scale: isSubmitting || success ? 1 : 0.99 }}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 rounded-full border-2 border-amber-900/40 border-t-amber-900 animate-spin" />
                          Creating account…
                        </span>
                      ) : success ? (
                        'Account created!'
                      ) : (
                        'Create Account'
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold transition-colors hover:underline" style={{ color: '#F4A900' }}>
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
