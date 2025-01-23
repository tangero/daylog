import RecoveryForm from "@/components/auth/RecoveryForm";
import { generateRecoveryCodeForUser, resetPasswordWithCode } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";

export default function RecoveryPage() {
  const { toast } = useToast();

  const handleGenerateCode = async (email: string) => {
    const code = await generateRecoveryCodeForUser(email);
    toast({
      title: "Recovery Code Generated",
      description: `Your recovery code is: ${code}\nPlease save this code as it will be needed to reset your password.`,
      duration: 30000, // 30 seconds
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <RecoveryForm
        onGenerateCode={handleGenerateCode}
        onRecovery={resetPasswordWithCode}
      />
    </div>
  );
}
