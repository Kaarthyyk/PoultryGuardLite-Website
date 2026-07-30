'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useState, useRef, useEffect } from 'react';
import { User, Mail, LogOut, Loader2, Building, Phone, MapPin, Globe, CreditCard, UploadCloud, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { compressAndCropToSquare } from '@/lib/image-utils';

export function ProfileClient() {
  const { user, userProfile, updateProfileData, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.displayName || '');
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Contact Info state
  const [companyName, setCompanyName] = useState(userProfile?.companyName || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [companyEmail, setCompanyEmail] = useState(userProfile?.companyEmail || '');
  const [website, setWebsite] = useState(userProfile?.website || '');
  const [gstNumber, setGstNumber] = useState(userProfile?.gstNumber || '');
  
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Logo state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(userProfile?.companyLogoUrl || null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Re-sync if userProfile loads
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (userProfile) {
      setDisplayName(userProfile.displayName || user?.displayName || '');
      setCompanyName(userProfile.companyName || '');
      setPhoneNumber(userProfile.phoneNumber || '');
      setAddress(userProfile.address || '');
      setCompanyEmail(userProfile.companyEmail || '');
      setWebsite(userProfile.website || '');
      setGstNumber(userProfile.gstNumber || '');
      
      // Only set preview from remote if not locally overridden
      if (!logoFile && !removeLogo) {
        setLogoPreview(userProfile.companyLogoUrl || null);
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [userProfile, user, logoFile, removeLogo]);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    
    setIsSavingContact(true);
    try {
      let finalLogo: Blob | undefined = undefined;
      
      if (logoFile) {
        try {
          finalLogo = await compressAndCropToSquare(logoFile, 400, 0.85);
        } catch (e) {
          console.error("Failed to compress image", e);
          finalLogo = logoFile;
        }
      }

      await updateProfileData(
        {
          displayName,
          companyName,
          phoneNumber,
          address,
          companyEmail,
          website,
          gstNumber,
        },
        finalLogo,
        removeLogo && !logoFile
      );
      
      toast('Profile information saved successfully', 'success');
      setLogoFile(null);
      setRemoveLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast('Failed to save profile information', 'error');
      console.error(err);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Image must be less than 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setLogoError('Only JPG, PNG, and WEBP formats are supported');
      return;
    }

    setLogoFile(file);
    setRemoveLogo(false);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account and company details.
        </p>
      </div>

      <div className="rounded-2xl p-6 glass border border-border/50">
        <form onSubmit={handleUpdateContact} className="space-y-6">
          
          {/* PERSONAL INFO */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/30">
              <User className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your full name"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="pl-10 opacity-70 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* COMPANY INFO */}
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/30">
              <Building className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Company Information</h3>
            </div>

            <div className="space-y-5">
              {/* Logo Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Company Logo</label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border bg-black/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoPreview} alt="Company Logo" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="w-20 h-20 rounded-xl border border-dashed border-primary/50 flex flex-col items-center justify-center bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud className="w-6 h-6 text-primary mb-1" />
                      <span className="text-[10px] text-muted-foreground">Upload Logo</span>
                    </div>
                  )}
                  <div className="flex-1 text-sm text-muted-foreground">
                    <p>JPG, PNG, or WEBP up to 5MB.</p>
                    <p>Used on PDFs and Reports.</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 text-xs h-7"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Company Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Poultry Farms Ltd." 
                      className="pl-10" 
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="1234567890" 
                      className="pl-10" 
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Farm Road, Country" 
                    className="pl-10" 
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Company Email (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input 
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      placeholder="info@company.com" 
                      className="pl-10" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Website (Optional)</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input 
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://company.com" 
                      className="pl-10" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">GST / VAT Number (Optional)</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input 
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      placeholder="Tax ID" 
                      className="pl-10" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <Button type="submit" loading={isSavingContact}>
              Save Profile
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl p-6 border border-red-500/20 bg-red-500/5">
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
