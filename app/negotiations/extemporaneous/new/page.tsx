"use client";

import { useRouter } from "next/navigation";
import { NewExtemporaneousNegotiation } from "../NewExtemporaneousNegotiation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewExtemporaneousNegotiationPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/negotiations/extemporaneous");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Negociação Extemporânea</h1>
          <p className="text-muted-foreground">
            Crie uma nova negociação extemporânea para procedimentos fora dos contratos padrão
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <NewExtemporaneousNegotiation onSuccess={handleSuccess} />
      </div>
    </div>
  );
} 