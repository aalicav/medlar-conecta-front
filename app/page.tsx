import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { TrendingUp, Clock } from "lucide-react"

export const metadata = {
  title: "Medlar - Conecta Saúde",
  description: "Sistema de retaguarda médica B2B que conecta planos de saúde, profissionais e clínicas",
}

export default async function Home() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (token) {
    redirect("/dashboard")
  }else{
    redirect("/login")
  }

  return (
    <div>
      <h1>Home</h1>
      {/* Sección de Negociaciones */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/negotiations">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Negociações</CardTitle>
              <CardDescription>
                Gerencie negociações com planos de saúde, profissionais e clínicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Contratos e valores</span>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/negotiations/extemporaneous">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Negociações Extemporâneas</CardTitle>
              <CardDescription>
                Procedimentos fora dos contratos padrão que requerem aprovação especial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Solicitações especiais</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
};