import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import type { Teacher } from '@/types';

export default function ClassesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const teacher = user as Teacher;
  const { classes, isLoading } = useAppStore();

  const myClasses = classes.filter(
    (c) => c.teacherIds?.includes(teacher?.id) || c.teacherIds?.includes((teacher as any)?._id)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
          <p className="text-muted-foreground">
            Manage your assigned classes and students
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {myClasses.map((cls) => (
          <Card key={cls.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                {cls.name}
                <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                  Grade {cls.grade}
                </span>
              </CardTitle>
              <CardDescription>{cls.section}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  {cls.studentIds?.length || 0} Students
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {cls.subjects?.length || 0} Subjects
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => navigate(`/teacher/classes/${cls.id}`)}
              >
                View Class
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}

        {myClasses.length === 0 && (
          <div className="col-span-full text-center p-12 border-2 border-dashed rounded-lg bg-secondary/10">
            <p className="text-muted-foreground">No classes assigned yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
