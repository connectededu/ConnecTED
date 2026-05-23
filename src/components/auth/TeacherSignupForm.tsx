import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, GraduationCap, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import type { TeacherSignupForm as TeacherFormType } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { programsApi } from '@/services/api';

interface Props {
  onSuccess: () => void;
  onBack: () => void;
}

// Simple debounce hook
function useDebounceValue<T>(value: T, delay: number = 500): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)
	import('react').then(React => {
		React.useEffect(() => {
			const handler = setTimeout(() => {
				setDebouncedValue(value)
			}, delay)
			return () => {
				clearTimeout(handler)
			}
		}, [value, delay])
	})
	return debouncedValue
}

export default function TeacherSignupForm({ onSuccess }: Props) {
  const { signupTeacher, isLoading } = useAuthStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<TeacherFormType>({
    name: '',
    email: '',
    phone: '',
    password: '',
    staffId: '',
    subjects: [],
    yearsOfExperience: 0
  });

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounceValue(search, 300)
  const [isFocused, setIsFocused] = useState(false)
  
  const { data: subjects = [] } = useQuery({
    queryKey: ['programs-subjects', debouncedSearch],
    queryFn: () => programsApi.getSubjects(debouncedSearch).then(r => r.data.data),
  })

  const updateField = (field: keyof TeacherFormType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSubject = (subject: string) => {
    if (!formData.subjects.includes(subject)) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, subject]
      }));
    }
    setSearch('');
    setIsFocused(false);
  };

  const handleRemoveSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s !== subject)
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        toast.error('Please fill in all required fields');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.subjects.length === 0) {
      toast.error('Please select at least one subject');
      return;
    }

    const result = await signupTeacher(formData);
    if (result.success) {
      toast.success(result.message);
      onSuccess();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <motion.div
      key="teacher-signup"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <div className="badge-teacher inline-block mb-4">
          <GraduationCap className="w-4 h-4 inline mr-2" />
          Teacher Registration
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Join our teaching team
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Step {step} of 2
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= step ? 'bg-teacher' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-foreground">Personal Information</h3>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="you@school.edu"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+1 555-0100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Create a strong password"
                required
              />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-foreground">Professional Information</h3>
            <div className="space-y-2">
              <Label htmlFor="staffId">Staff ID (if known)</Label>
              <Input
                id="staffId"
                value={formData.staffId}
                onChange={(e) => updateField('staffId', e.target.value)}
                placeholder="e.g., TCH-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Subjects Taught *</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Search and select subjects you can teach
              </p>
              
              {formData.subjects.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.subjects.map(subj => (
                    <Badge key={subj} variant="secondary" className="flex items-center gap-1">
                      {subj}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveSubject(subj)} />
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="relative">
                <Input 
                  placeholder="Search subjects..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                />
                {isFocused && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
                    {subjects.length === 0 && search.length > 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No matching subjects found
                      </div>
                    ) : (
                      subjects.map((subj: string) => (
                        <div 
                          key={subj} 
                          className="p-2 text-sm hover:bg-accent cursor-pointer"
                          onMouseDown={(e) => { e.preventDefault(); handleAddSubject(subj) }}
                        >
                          {subj}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                max="50"
                value={formData.yearsOfExperience || ''}
                onChange={(e) => updateField('yearsOfExperience', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </motion.div>
        )}

        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button type="button" onClick={handleNext} className="flex-1 bg-role-teacher hover:opacity-90">
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              className="flex-1 bg-role-teacher hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit for Approval'
              )}
            </Button>
          )}
        </div>
      </form>
    </motion.div>
  );
}
