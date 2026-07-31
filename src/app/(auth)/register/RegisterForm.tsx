'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Building, Phone, MapPin, CreditCard, UploadCloud, X } from 'lucide-react';
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
  ownerName: z.string().min(1, 'Owner Name is required'),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be at most 15 digits')
    .regex(/^\d+$/, 'Phone number must contain only numbers'),
  whatsappNumber: z.string().optional().or(z.literal('')),
  companyEmail: z.string().email('Valid email required').optional().or(z.literal('')),
  gstNumber: z.string().optional(),
  farmRegistrationNumber: z.string().optional(),
  websiteUrl: z.string().url('Valid URL required').optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  pincode: z.string().min(1, 'Pincode is required').regex(/^\d+$/, 'Pincode must be numbers'),
});

const step3Schema = z.object({
  companyDescription: z.string().optional(),
});

const step4Schema = z.object({
  defaultFarmName: z.string().optional(),
  defaultFarmType: z.string().optional(),
  preferredCurrency: z.string().optional(),
  preferredWeightUnit: z.string().optional(),
});

const fullSchema = z.intersection(
  z.intersection(step1Schema, step2Schema),
  z.intersection(step3Schema, step4Schema)
);

type RegisterFormValues = z.infer<typeof fullSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

export function RegisterForm() {
  const { register: authRegister } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image state
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(fullSchema),
    mode: 'onTouched',
    defaultValues: {
      preferredCurrency: 'INR',
      preferredWeightUnit: 'Kg',
      defaultFarmType: 'Broiler'
    }
  });

  const handleNext = async () => {
    setAuthError(null);
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(['name', 'email', 'password', 'confirmPassword']);
    } else if (step === 2) {
      isValid = await trigger([
        'companyName', 'ownerName', 'phoneNumber', 'whatsappNumber', 
        'companyEmail', 'gstNumber', 'farmRegistrationNumber', 'websiteUrl', 
        'address', 'city', 'state', 'country', 'pincode'
      ]);
    } else if (step === 3) {
      isValid = await trigger(['companyDescription']);
    } else if (step === 4) {
      isValid = await trigger(['defaultFarmName', 'defaultFarmType', 'preferredCurrency', 'preferredWeightUnit']);
    }
    
    if (isValid) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'photo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (type === 'logo') setLogoError('Image must be less than 5MB');
      else setPhotoError('Image must be less than 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      if (type === 'logo') setLogoError('Only JPG, PNG, and WEBP formats are supported');
      else setPhotoError('Only JPG, PNG, and WEBP formats are supported');
      return;
    }

    if (type === 'logo') {
      setLogoError(null);
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setPhotoError(null);
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = (type: 'logo' | 'photo') => {
    if (type === 'logo') {
      setLogoFile(null);
      setLogoPreview(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
    } else {
      setPhotoFile(null);
      setPhotoPreview(null);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const onSubmit = async (values: RegisterFormValues) => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      let finalLogo: Blob | undefined = undefined;
      let finalPhoto: Blob | undefined = undefined;
      
      if (logoFile) {
        try {
          finalLogo = await compressAndCropToSquare(logoFile, 400, 0.85);
        } catch (e) {
          console.error("Failed to compress logo", e);
          finalLogo = logoFile;
        }
      }

      if (photoFile) {
        try {
          finalPhoto = await compressAndCropToSquare(photoFile, 400, 0.85);
        } catch (e) {
          console.error("Failed to compress photo", e);
          finalPhoto = photoFile;
        }
      }

      await authRegister({
        name: values.name,
        email: values.email,
        password: values.password,
        ownerName: values.ownerName,
        companyName: values.companyName,
        phoneNumber: values.phoneNumber,
        address: values.address,
        city: values.city,
        state: values.state,
        country: values.country,
        pincode: values.pincode,
        whatsappNumber: values.whatsappNumber,
        companyEmail: values.companyEmail,
        gstNumber: values.gstNumber,
        farmRegistrationNumber: values.farmRegistrationNumber,
        websiteUrl: values.websiteUrl,
        companyDescription: values.companyDescription,
        preferredCurrency: values.preferredCurrency,
        preferredWeightUnit: values.preferredWeightUnit,
        defaultFarmName: values.defaultFarmName,
        defaultFarmType: values.defaultFarmType,
        profilePhotoFile: finalPhoto,
        logoFile: finalLogo
      });
      
      setSuccess(true);
      setTimeout(() => router.replace('/dashboard/welcome'), 1500);
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
      <div className="w-full max-w-2xl">
        <motion.div
          className="flex items-center gap-3 mb-8 justify-center"
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
          className="bg-card p-8 rounded-2xl border border-border shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {step === 1 && 'Personal Information'}
            {step === 2 && 'Company Information'}
            {step === 3 && 'Branding'}
            {step === 4 && 'Farm Defaults'}
            {step === 5 && 'Confirmation'}
          </h2>
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`}
                style={s <= step ? { background: '#F4A900' } : {}}
              />
            ))}
          </div>

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
              <span>Account created! Redirecting to welcome screen…</span>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Full name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Your full name"
                          className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border"
                          style={{ border: errors.name ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties}
                          {...register('name')}
                        />
                      </div>
                      {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Email address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                          type="email"
                          placeholder="you@example.com"
                          className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border"
                          style={{ border: errors.email ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties}
                          {...register('email')}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
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

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Confirm password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
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
                  </div>
                  
                  <div className="space-y-1.5 pt-2 border-t border-border mt-6">
                    <label className="text-sm font-medium text-foreground block mb-2 mt-4">Profile Photo (Optional)</label>
                    <div className="flex items-center gap-4">
                      {photoPreview ? (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoPreview} alt="Preview" className="object-cover w-full h-full" />
                          <button type="button" onClick={() => removeImage('photo')} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-full border border-dashed border-primary/50 flex flex-col items-center justify-center bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                          onClick={() => photoInputRef.current?.click()}
                        >
                          <UploadCloud className="w-5 h-5 text-primary mb-1" />
                        </div>
                      )}
                      <div className="flex-1 text-xs text-muted-foreground">
                        <p>JPG, PNG, or WEBP. Max 5MB.</p>
                      </div>
                    </div>
                    <input type="file" ref={photoInputRef} onChange={(e) => handleImageChange(e, 'photo')} accept="image/jpeg, image/png, image/webp" className="hidden" />
                    {photoError && <p className="text-xs text-red-400">{photoError}</p>}
                  </div>

                  <motion.button type="button" onClick={handleNext} className="w-full py-3 rounded-xl text-sm font-semibold transition-all mt-4" style={{ background: 'linear-gradient(135deg, #F4A900 0%, #d4920a 100%)', color: '#1A1200', boxShadow: '0 4px 20px rgba(244,169,0,0.35)' }}>
                    Next Step
                  </motion.button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Company Name *</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" placeholder="Poultry Farms Ltd." className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border" style={{ border: errors.companyName ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties} {...register('companyName')} />
                      </div>
                      {errors.companyName && <p className="text-xs text-red-400">{errors.companyName.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Owner Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" placeholder="John Doe" className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border" style={{ border: errors.ownerName ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties} {...register('ownerName')} />
                      </div>
                      {errors.ownerName && <p className="text-xs text-red-400">{errors.ownerName.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="tel" placeholder="1234567890" className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border" style={{ border: errors.phoneNumber ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties} {...register('phoneNumber')} />
                      </div>
                      {errors.phoneNumber && <p className="text-xs text-red-400">{errors.phoneNumber.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">WhatsApp (Optional)</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="tel" placeholder="1234567890" className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border" style={{ border: '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties} {...register('whatsappNumber')} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Company Email (Optional)</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="email" placeholder="info@company.com" className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border" style={{ border: errors.companyEmail ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties} {...register('companyEmail')} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">GST / VAT (Optional)</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" placeholder="Tax ID" className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border" style={{ border: '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties} {...register('gstNumber')} />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-foreground">Address *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" placeholder="123 Farm Road" className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border" style={{ border: errors.address ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties} {...register('address')} />
                      </div>
                      {errors.address && <p className="text-xs text-red-400">{errors.address.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">City *</label>
                      <input type="text" placeholder="City" className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border" style={{ border: errors.city ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties} {...register('city')} />
                      {errors.city && <p className="text-xs text-red-400">{errors.city.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">State *</label>
                      <input type="text" placeholder="State" className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border" style={{ border: errors.state ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties} {...register('state')} />
                      {errors.state && <p className="text-xs text-red-400">{errors.state.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Country *</label>
                      <input type="text" placeholder="Country" className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border" style={{ border: errors.country ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties} {...register('country')} />
                      {errors.country && <p className="text-xs text-red-400">{errors.country.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Pincode *</label>
                      <input type="text" placeholder="Pincode" className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border" style={{ border: errors.pincode ? '1px solid rgba(183,28,28,0.7)' : '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties} {...register('pincode')} />
                      {errors.pincode && <p className="text-xs text-red-400">{errors.pincode.message}</p>}
                    </div>

                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setStep(1)} className="py-3 px-6 rounded-xl text-sm font-semibold transition-all bg-background border border-border text-foreground hover:bg-muted">
                      Back
                    </button>
                    <motion.button type="button" onClick={handleNext} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all" style={{ background: 'linear-gradient(135deg, #F4A900 0%, #d4920a 100%)', color: '#1A1200', boxShadow: '0 4px 20px rgba(244,169,0,0.35)' }}>
                      Next Step
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="space-y-1.5 pt-2">
                    <label className="text-sm font-medium text-foreground">Company Logo (Optional)</label>
                    <div className="flex items-center gap-4">
                      {logoPreview ? (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={logoPreview} alt="Logo preview" className="object-cover w-full h-full" />
                          <button type="button" onClick={() => removeImage('logo')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="w-20 h-20 rounded-xl border border-dashed border-primary/50 flex flex-col items-center justify-center bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <UploadCloud className="w-6 h-6 text-primary mb-1" />
                          <span className="text-xs text-muted-foreground">Upload Logo</span>
                        </div>
                      )}
                      <div className="flex-1 text-sm text-muted-foreground">
                        <p>JPG, PNG, or WEBP. Max 5MB.</p>
                        <p>Appears on reports and PDFs.</p>
                      </div>
                    </div>
                    <input type="file" ref={logoInputRef} onChange={(e) => handleImageChange(e, 'logo')} accept="image/jpeg, image/png, image/webp" className="hidden" />
                    {logoError && <p className="text-xs text-red-400">{logoError}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Company Description (Optional)</label>
                    <textarea 
                      placeholder="Briefly describe your company or farm..."
                      className="w-full rounded-xl px-4 py-3 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border min-h-[100px] resize-y"
                      style={{ border: '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties}
                      {...register('companyDescription')}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setStep(2)} className="py-3 px-6 rounded-xl text-sm font-semibold transition-all bg-background border border-border text-foreground hover:bg-muted">
                      Back
                    </button>
                    <motion.button type="button" onClick={handleNext} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all" style={{ background: 'linear-gradient(135deg, #F4A900 0%, #d4920a 100%)', color: '#1A1200', boxShadow: '0 4px 20px rgba(244,169,0,0.35)' }}>
                      Next Step
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <p className="text-sm text-muted-foreground mb-4">Set up default values to pre-fill future forms. You can change these later in Profile Settings.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Default Farm Name (Optional)</label>
                      <input type="text" placeholder="Main Farm" className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border" style={{ border: '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties} {...register('defaultFarmName')} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Farm Type (Optional)</label>
                      <select className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border appearance-none" style={{ border: '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties} {...register('defaultFarmType')}>
                        <option value="Broiler">Broiler</option>
                        <option value="Layer">Layer</option>
                        <option value="Breeder">Breeder</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Preferred Currency (Optional)</label>
                      <select className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border appearance-none" style={{ border: '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties} {...register('preferredCurrency')}>
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Preferred Weight Unit (Optional)</label>
                      <select className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground transition-all outline-none focus:ring-2 bg-background/50 border-border appearance-none" style={{ border: '1px solid rgba(74,59,16,0.7)', '--tw-ring-color': '#F4A900' } as React.CSSProperties} {...register('preferredWeightUnit')}>
                        <option value="Kg">Kg</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setStep(3)} className="py-3 px-6 rounded-xl text-sm font-semibold transition-all bg-background border border-border text-foreground hover:bg-muted">
                      Back
                    </button>
                    <motion.button type="button" onClick={handleNext} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all" style={{ background: 'linear-gradient(135deg, #F4A900 0%, #d4920a 100%)', color: '#1A1200', boxShadow: '0 4px 20px rgba(244,169,0,0.35)' }}>
                      Review Summary
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="p-4 rounded-xl border border-border/50 bg-background/30 space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-primary mb-1 border-b border-border/50 pb-1">Personal Info</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div><span className="text-muted-foreground">Name:</span> {getValues('name')}</div>
                        <div><span className="text-muted-foreground">Email:</span> {getValues('email')}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-primary mb-1 border-b border-border/50 pb-1">Company Info</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div><span className="text-muted-foreground">Company:</span> {getValues('companyName')}</div>
                        <div><span className="text-muted-foreground">Owner:</span> {getValues('ownerName')}</div>
                        <div><span className="text-muted-foreground">Phone:</span> {getValues('phoneNumber')}</div>
                        <div><span className="text-muted-foreground">Location:</span> {getValues('city')}, {getValues('state')}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-primary mb-1 border-b border-border/50 pb-1">Defaults</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div><span className="text-muted-foreground">Type:</span> {getValues('defaultFarmType')}</div>
                        <div><span className="text-muted-foreground">Currency:</span> {getValues('preferredCurrency')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setStep(4)} className="py-3 px-6 rounded-xl text-sm font-semibold transition-all bg-background border border-border text-foreground hover:bg-muted" disabled={isSubmitting || success}>
                      Back
                    </button>
                    <motion.button type="submit" disabled={isSubmitting || success} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #F4A900 0%, #d4920a 100%)', color: '#1A1200', boxShadow: '0 4px 20px rgba(244,169,0,0.35)' }}>
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 rounded-full border-2 border-amber-900/40 border-t-amber-900 animate-spin" />
                          Creating account…
                        </span>
                      ) : success ? (
                        'Account created!'
                      ) : (
                        'Confirm & Create Account'
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {step === 1 && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold transition-colors hover:underline" style={{ color: '#F4A900' }}>
                Sign in
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
