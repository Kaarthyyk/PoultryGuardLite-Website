'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useState } from 'react';
import { User, Mail, LogOut, Loader2, Building, Phone, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import auth from '@/lib/firebase/auth';
import db from '@/lib/firebase/firestore';
import { useEffect } from 'react';

export function ProfileClient() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Contact Info state
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isContactLoading, setIsContactLoading] = useState(true);
  const [isSavingContact, setIsSavingContact] = useState(false);

  useEffect(() => {
    async function loadContactInfo() {
      if (!user?.uid) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCompanyName(data.companyName || '');
          setPhoneNumber(data.phoneNumber || '');
          setAddress(data.address || '');
        }
      } catch (err) {
        console.error('Failed to load contact info', err);
      } finally {
        setIsContactLoading(false);
      }
    }
    loadContactInfo();
  }, [user?.uid]);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    
    setIsSavingContact(true);
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          companyName,
          phoneNumber,
          address,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      toast('Contact information saved successfully', 'success');
    } catch (err) {
      toast('Failed to save contact information', 'error');
      console.error(err);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setIsUpdating(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });
      // Force reload to update context if needed or just show success
      toast('Profile updated successfully', 'success');
      window.location.reload(); // Simple way to refresh context
    } catch {
      toast('Failed to update profile', 'error');
    } finally {
      setIsUpdating(false);
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
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account details and preferences.
        </p>
      </div>

      <div className="rounded-2xl p-6 glass">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{user?.displayName || 'User'}</h3>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Display Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
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
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </div>
              <Input
                value={user?.email || ''}
                disabled
                className="pl-10 opacity-70 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" loading={isUpdating}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl p-6 glass border border-border/50">
        <div className="flex items-center gap-2 mb-6">
          <Building className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground text-lg">Company & Contact Information</h3>
        </div>

        {isContactLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleUpdateContact} className="space-y-5">
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
                    placeholder="+1 234 567 890" 
                    className="pl-10" 
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
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" loading={isSavingContact}>
                Save Contact Info
              </Button>
            </div>
          </form>
        )}
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
