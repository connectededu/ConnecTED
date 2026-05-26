import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Camera, Loader2, Mail, Phone, Lock, User as UserIcon,
  CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { authApi, uploadApi } from '@/services/api';
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';

export default function ProfilePage() {
  const { user, updateProfile, updateAvatar } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [isDragging, setIsDragging] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyingSending, setVerifyingSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Track Firebase auth state for email verification
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setEmailVerified(fbUser?.emailVerified ?? false);
    });
    return () => unsub();
  }, []);

  const roleColor = user?.role === 'parent' ? 'parent' : user?.role === 'teacher' ? 'teacher' : 'admin';
  const roleBadge = user?.role === 'parent' ? 'badge-parent' : user?.role === 'teacher' ? 'badge-teacher' : 'badge-admin';

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    uploadApi
      .uploadFile(file)
      .then((response) => {
        const imageUrl = response.data.url;
        // Update in local store immediately
        updateAvatar(imageUrl);
        // Persist to backend via auth/me
        return authApi.updateMyProfile({ profilePicture: imageUrl });
      })
      .then(() => {
        toast.success('Profile photo updated!');
      })
      .catch((error) => {
        console.error('Image upload error:', error);
        toast.error('Failed to upload photo');
      })
      .finally(() => {
        setIsUploadingImage(false);
      });
  }, [updateAvatar, user]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Update via self-service endpoint
      await authApi.updateMyProfile({
        name: formData.name,
        phone: formData.phone,
      });
      // Update local store
      updateProfile({ name: formData.name, phone: formData.phone } as any);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.new.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser || !currentUser.email) {
      toast.error('You must be logged in to change your password');
      return;
    }

    setIsSaving(true);
    try {
      // Re-authenticate before password change
      const credential = EmailAuthProvider.credential(currentUser.email, passwordData.current);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwordData.new);
      setPasswordData({ current: '', new: '', confirm: '' });
      toast.success('Password changed successfully!');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        toast.error('Current password is incorrect');
      } else {
        toast.error(err.message || 'Failed to change password');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!firebaseUser) return;
    setVerifyingSending(true);
    try {
      await sendEmailVerification(firebaseUser);
      toast.success('Verification email sent! Check your inbox.');
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        toast.error('Too many requests. Please wait before trying again.');
      } else {
        toast.error('Failed to send verification email');
      }
    } finally {
      setVerifyingSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </motion.div>

      {/* Profile Photo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div
                className={`relative group cursor-pointer ${isDragging ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <Avatar className={`w-24 h-24 border-4 border-${roleColor}`}>
                  <AvatarImage src={user.avatar || (user as any).profilePicture} />
                  <AvatarFallback className={`text-2xl bg-${roleColor}-light text-${roleColor}-dark`}>
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-foreground/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {isUploadingImage ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploadingImage}
                  />
                </label>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={roleBadge}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  {user.role === 'teacher' && ((user as any).teacherData?.subjects || (user as any).subjects)?.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      {((user as any).teacherData?.subjects || (user as any).subjects).join(', ')}
                    </span>
                  )}
                </div>
                
                {/* Email verification status */}
                <div className="flex items-center gap-2 mt-3">
                  {emailVerified ? (
                    <div className="flex items-center gap-1.5 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Email verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-sm text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>Email not verified</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2"
                        onClick={handleSendVerificationEmail}
                        disabled={verifyingSending}
                      >
                        {verifyingSending ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3 mr-1" />
                        )}
                        {verifyingSending ? 'Sending…' : 'Verify Email'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Drag and drop an image or click to upload. Max size: 5MB
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Personal Information</CardTitle>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                  {emailVerified && (
                    <Badge variant="outline" className="ml-1 text-xs text-green-600 border-green-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  )}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="opacity-70"
                />
                <p className="text-xs text-muted-foreground">
                  Email changes require re-authentication (contact admin).
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ name: user.name, email: user.email, phone: user.phone });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.current}
                onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                placeholder="Enter current password"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={!passwordData.current || !passwordData.new || !passwordData.confirm || isSaving}
              variant="outline"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
