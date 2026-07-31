/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useState, useRef, useEffect, useCallback } from 'react';
import { User, Mail, LogOut, Loader2, Building, Phone, MapPin, Globe, CreditCard, UploadCloud, X, Hash, Map, Settings, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { compressAndCropToSquare } from '@/lib/image-utils';

export function ProfileClient() {
  const { user, userProfile, updateProfileData, refreshProfile, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Personal Info
  const [displayName, setDisplayName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  // Company Info
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [farmRegistrationNumber, setFarmRegistrationNumber] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');

  // Defaults
  const [defaultFarmName, setDefaultFarmName] = useState('');
  const [defaultFarmType, setDefaultFarmType] = useState('Broiler');
  const [preferredCurrency, setPreferredCurrency] = useState('INR');
  const [preferredWeightUnit, setPreferredWeightUnit] = useState('Kg');

  // Images state
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || user?.displayName || '');
      setWhatsappNumber(userProfile.whatsappNumber || '');
      
      setCompanyName(userProfile.companyName || '');
      setOwnerName(userProfile.ownerName || '');
      setPhoneNumber(userProfile.phoneNumber || '');
      setCompanyEmail(userProfile.companyEmail || '');
      setWebsiteUrl(userProfile.websiteUrl || '');
      setAddress(userProfile.address || '');
      setCity(userProfile.city || '');
      setState(userProfile.state || '');
      setCountry(userProfile.country || '');
      setPincode(userProfile.pincode || '');
      setGstNumber(userProfile.gstNumber || '');
      setFarmRegistrationNumber(userProfile.farmRegistrationNumber || '');
      setCompanyDescription(userProfile.companyDescription || '');

      setDefaultFarmName(userProfile.defaultFarmName || '');
      setDefaultFarmType(userProfile.defaultFarmType || 'Broiler');
      setPreferredCurrency(userProfile.preferredCurrency || 'INR');
      setPreferredWeightUnit(userProfile.preferredWeightUnit || 'Kg');
      
      setLogoPreview(userProfile.companyLogoUrl || null);
      setPhotoPreview(userProfile.profilePhotoUrl || null);
    }
    setLogoFile(null);
    setRemoveLogo(false);
    setPhotoFile(null);
    setRemovePhoto(false);
    setLogoError(null);
    setPhotoError(null);
    setIsEditing(false);
  }, [userProfile, user]);

  // Initialize from userProfile
  useEffect(() => {
    if (!isEditing) {
      resetForm();
    }
  }, [isEditing, resetForm]);

  const handleCancel = () => {
    resetForm();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    
    setIsSaving(true);
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

      await updateProfileData(
        {
          displayName,
          whatsappNumber,
          companyName,
          ownerName,
          phoneNumber,
          companyEmail,
          websiteUrl,
          address,
          city,
          state,
          country,
          pincode,
          gstNumber,
          farmRegistrationNumber,
          companyDescription,
          defaultFarmName,
          defaultFarmType,
          preferredCurrency,
          preferredWeightUnit,
        },
        finalLogo,
        removeLogo && !logoFile,
        finalPhoto,
        removePhoto && !photoFile
      );
      
      await refreshProfile();
      await queryClient.invalidateQueries();
      toast('✅ Profile Updated Successfully', 'success');
      
      setIsEditing(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile information';
      toast(errorMessage, 'error');
      console.error(err);
    } finally {
      setIsSaving(false);
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
      setRemoveLogo(false);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setPhotoError(null);
      setPhotoFile(file);
      setRemovePhoto(false);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = (type: 'logo' | 'photo') => {
    if (type === 'logo') {
      setLogoFile(null);
      setLogoPreview(null);
      setRemoveLogo(true);
      if (logoInputRef.current) logoInputRef.current.value = '';
    } else {
      setPhotoFile(null);
      setPhotoPreview(null);
      setRemovePhoto(true);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const inputClassName = (baseClass = "") => {
    if (!isEditing) {
      return `${baseClass} bg-background/30 border-border/20 cursor-default focus:ring-0 opacity-90`;
    }
    return baseClass;
  };

  const selectClassName = () => {
    const base = "w-full rounded-md px-3 py-2 text-sm text-foreground transition-all outline-none appearance-none";
    if (!isEditing) {
      return `${base} bg-background/30 border border-border/20 cursor-default focus:ring-0 opacity-90`;
    }
    return `${base} bg-background border border-input focus:ring-2`;
  };

  const textareaClassName = () => {
    const base = "w-full rounded-md px-3 py-2 text-sm text-foreground transition-all outline-none min-h-[80px]";
    if (!isEditing) {
      return `${base} bg-background/30 border border-border/20 cursor-default focus:ring-0 opacity-90`;
    }
    return `${base} bg-background border border-input focus:ring-2`;
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push('/login');
    } catch {
      toast('Failed to sign out', 'error');
      setIsSigningOut(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account and company details.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          {!isEditing ? (
            <Button type="button" onClick={() => setIsEditing(true)} className="w-full sm:w-auto px-6" style={{ background: 'linear-gradient(135deg, #F4A900 0%, #d4920a 100%)', color: '#1A1200' }}>
              Edit Profile
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleCancel} className="w-full sm:w-auto px-6" disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleSave} loading={isSaving} className="w-full sm:w-auto px-8" style={{ background: 'linear-gradient(135deg, #F4A900 0%, #d4920a 100%)', color: '#1A1200' }}>
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* PERSONAL INFO & PHOTO */}
        <div className="rounded-2xl p-6 glass border border-border/50">
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-border/30">
            <User className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground text-lg">Personal Information</h3>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-primary/20 bg-primary/5">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="Profile" className="object-cover w-full h-full" />
                ) : (
                  <User className="w-12 h-12 text-primary/40 m-auto mt-7" />
                )}
                <div 
                  className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isEditing ? 'opacity-0 hover:opacity-100 cursor-pointer' : 'opacity-0 hidden'}`}
                  onClick={() => isEditing && photoInputRef.current?.click()}
                >
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => photoInputRef.current?.click()} disabled={!isEditing} className={!isEditing ? 'opacity-50' : ''}>
                  Upload
                </Button>
                {photoPreview && (
                  <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveImage('photo')} disabled={!isEditing} className={!isEditing ? 'opacity-50' : ''}>
                    Remove
                  </Button>
                )}
              </div>
              <input type="file" ref={photoInputRef} onChange={(e) => handleImageChange(e, 'photo')} accept="image/jpeg, image/png, image/webp" className="hidden" />
              {photoError && <p className="text-xs text-red-400">{photoError}</p>}
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Display Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your full name" readOnly={!isEditing} className={inputClassName("pl-10")} required />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input value={user?.email || ''} disabled className="pl-10 opacity-70 cursor-not-allowed" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Firebase UID</label>
                <div className="relative">
                  <Input value={user?.uid || ''} disabled className="opacity-70 cursor-not-allowed font-mono text-xs" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Registration Date</label>
                <div className="relative">
                  <Input value={userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : ''} disabled className="opacity-70 cursor-not-allowed" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Last Updated</label>
                <div className="relative">
                  <Input value={userProfile?.updatedAt ? new Date(userProfile.updatedAt).toLocaleDateString() : ''} disabled className="opacity-70 cursor-not-allowed" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">WhatsApp Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="1234567890" readOnly={!isEditing} className={inputClassName("pl-10")} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COMPANY INFO */}
        <div className="rounded-2xl p-6 glass border border-border/50">
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-border/30">
            <Building className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground text-lg">Company Information</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Company Logo</label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border bg-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoPreview} alt="Company Logo" className="object-cover w-full h-full" />
                    <button type="button" onClick={() => handleRemoveImage('logo')} disabled={!isEditing} className={`absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 transition-colors ${!isEditing ? 'opacity-0 hidden' : 'hover:bg-red-600'}`}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className={`w-20 h-20 rounded-xl border border-dashed border-primary/50 flex flex-col items-center justify-center bg-primary/5 transition-colors ${isEditing ? 'cursor-pointer hover:bg-primary/10' : 'opacity-50 cursor-default'}`} onClick={() => isEditing && logoInputRef.current?.click()}>
                    <UploadCloud className="w-6 h-6 text-primary mb-1" />
                    <span className="text-[10px] text-muted-foreground">Upload Logo</span>
                  </div>
                )}
                <div className="flex-1 text-sm text-muted-foreground">
                  <p>JPG, PNG, or WEBP up to 5MB.</p>
                  <p>Used on PDFs and Reports.</p>
                </div>
              </div>
              <input type="file" ref={logoInputRef} onChange={(e) => handleImageChange(e, 'logo')} accept="image/jpeg, image/png, image/webp" className="hidden" />
              {logoError && <p className="text-xs text-red-400">{logoError}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Company Name *</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Poultry Farms Ltd." readOnly={!isEditing} className={inputClassName("pl-10")} required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Owner Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner Name" readOnly={!isEditing} className={inputClassName("pl-10")} required />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="1234567890" readOnly={!isEditing} className={inputClassName("pl-10")} required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Company Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} placeholder="info@company.com" readOnly={!isEditing} className={inputClassName("pl-10")} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://company.com" readOnly={!isEditing} className={inputClassName("pl-10")} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">GST / VAT Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="Tax ID" readOnly={!isEditing} className={inputClassName("pl-10")} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Farm Registration Number</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input value={farmRegistrationNumber} onChange={(e) => setFarmRegistrationNumber(e.target.value)} placeholder="Registration Number" readOnly={!isEditing} className={inputClassName("pl-10")} />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-foreground">Company Description</label>
              <textarea 
                value={companyDescription} 
                onChange={(e) => setCompanyDescription(e.target.value)} 
                placeholder="Briefly describe your company or farm..." 
                readOnly={!isEditing} className={textareaClassName()} 
                style={{ '--tw-ring-color': '#F4A900' } as React.CSSProperties}
              />
            </div>
            
            <h4 className="font-semibold text-foreground text-sm pt-2 mb-2 border-b border-border/30 pb-2">Location Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Farm Road, Country" readOnly={!isEditing} className={inputClassName("pl-10")} required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">City *</label>
                <div className="relative">
                  <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" readOnly={!isEditing} className={inputClassName("pl-10")} required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">State *</label>
                <div className="relative">
                  <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" readOnly={!isEditing} className={inputClassName("pl-10")} required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Country *</label>
                <div className="relative">
                  <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" readOnly={!isEditing} className={inputClassName("pl-10")} required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Pincode *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode" readOnly={!isEditing} className={inputClassName("pl-10")} required />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DEFAULT SETTINGS */}
        <div className="rounded-2xl p-6 glass border border-border/50">
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-border/30">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground text-lg">App Preferences</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Default Farm Name</label>
              <Input value={defaultFarmName} onChange={(e) => setDefaultFarmName(e.target.value)} placeholder="Main Farm" readOnly={!isEditing} className={inputClassName()} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Default Farm Type</label>
              <select 
                value={defaultFarmType} 
                onChange={(e) => setDefaultFarmType(e.target.value)} 
                disabled={!isEditing} className={selectClassName()} 
                style={{ '--tw-ring-color': '#F4A900' } as React.CSSProperties}
              >
                <option value="Broiler">Broiler</option>
                <option value="Layer">Layer</option>
                <option value="Breeder">Breeder</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Preferred Currency</label>
              <select 
                value={preferredCurrency} 
                onChange={(e) => setPreferredCurrency(e.target.value)} 
                disabled={!isEditing} className={selectClassName()} 
                style={{ '--tw-ring-color': '#F4A900' } as React.CSSProperties}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Preferred Weight Unit</label>
              <select 
                value={preferredWeightUnit} 
                onChange={(e) => setPreferredWeightUnit(e.target.value)} 
                disabled={!isEditing} className={selectClassName()} 
                style={{ '--tw-ring-color': '#F4A900' } as React.CSSProperties}
              >
                <option value="Kg">Kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
          </div>
        </div>

      </form>

      <div className="rounded-2xl p-6 border border-red-500/20 bg-red-500/5 mt-8">
        <h3 className="font-semibold text-red-400 mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Log out of your account on this device.
        </p>
        <Button 
          variant="outline" 
          className="text-red-400 border-red-500/20 hover:bg-red-500/10"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
          Sign Out
        </Button>
      </div>
    </div>
  );
}
