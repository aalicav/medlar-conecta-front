import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Add these interfaces after imports and before formSchema
interface Clinic {
  id: string;
  name: string;
}

interface Specialty {
  id: string;
  name: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos").max(11, "CPF deve ter 11 dígitos"),
  birth_date: z.string().min(1, "Data de nascimento é obrigatória"),
  gender: z.enum(["male", "female", "other"]),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  email: z.string().email("Email inválido"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  specialty: z.string().min(1, "Especialidade é obrigatória"),
  crm: z.string().min(1, "CRM é obrigatório"),
  bio: z.string().optional(),
  clinic_id: z.string().min(1, "Clínica é obrigatória"),
})

type FormValues = z.infer<typeof formSchema>

interface ProfessionalFormProps {
  initialData?: Partial<FormValues>
  onSubmit: (data: FormValues) => Promise<void>
  isClinicAdmin?: boolean
  clinicId?: string
}

export function ProfessionalForm({
  initialData,
  onSubmit,
  isClinicAdmin,
  clinicId
}: ProfessionalFormProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loadingClinics, setLoadingClinics] = useState(false)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loadingSpecialties, setLoadingSpecialties] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      cpf: initialData?.cpf || "",
      birth_date: initialData?.birth_date || "",
      gender: initialData?.gender || "other",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      zip_code: initialData?.zip_code || "",
      specialty: initialData?.specialty || "",
      crm: initialData?.crm || "",
      bio: initialData?.bio || "",
      clinic_id: isClinicAdmin ? clinicId : initialData?.clinic_id || "",
    },
  })

  useEffect(() => {
    const fetchClinics = async () => {
      if (isClinicAdmin) {
        // Se for admin da clínica, não precisa buscar clínicas
        setClinics([{ id: clinicId ?? '', name: "Minha Clínica" }])
        return
      }

      setLoadingClinics(true)
      try {
        const response = await fetch("/api/clinics")
        const data = await response.json()
        setClinics(data)
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as clínicas",
          variant: "destructive",
        })
      } finally {
        setLoadingClinics(false)
      }
    }

    const fetchSpecialties = async () => {
      setLoadingSpecialties(true)
      try {
        const response = await fetch("/api/specialties")
        const data = await response.json()
        setSpecialties(data)
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as especialidades",
          variant: "destructive",
        })
      } finally {
        setLoadingSpecialties(false)
      }
    }

    fetchClinics()
    fetchSpecialties()
  }, [isClinicAdmin, clinicId, toast])

  const handleSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      await onSubmit(data)
      toast({
        title: "Sucesso",
        description: "Profissional salvo com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o profissional",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Novo Profissional</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o CPF" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gênero</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o gênero" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o telefone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Digite o email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o endereço" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zip_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o CEP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite a cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o estado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialidade</FormLabel>
                      <Select
                        disabled={loadingSpecialties}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma especialidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {specialties.map((specialty) => (
                            <SelectItem key={specialty.id} value={specialty.id}>
                              {specialty.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="crm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CRM</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o CRM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biografia</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite a biografia do profissional"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isClinicAdmin && (
                <FormField
                  control={form.control}
                  name="clinic_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clínica</FormLabel>
                      <Select
                        disabled={loadingClinics}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma clínica" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clinics.map((clinic) => (
                            <SelectItem key={clinic.id} value={clinic.id}>
                              {clinic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={loading}
                >
                  Limpar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 