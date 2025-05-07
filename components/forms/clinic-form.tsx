import { zodResolver } from "@hookform/resolvers/zod"
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

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos").max(14, "CNPJ deve ter 14 dígitos"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  email: z.string().email("Email inválido"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  logo: z.string().optional(),
  cover_image: z.string().optional(),
  specialties: z.array(z.string()).min(1, "Selecione pelo menos uma especialidade"),
})

type FormValues = z.infer<typeof formSchema>

interface ClinicFormProps {
  initialData?: Partial<FormValues>
  onSubmit: (data: FormValues) => Promise<void>
}

export function ClinicForm({
  initialData,
  onSubmit,
}: ClinicFormProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [specialties, setSpecialties] = useState([])
  const [loadingSpecialties, setLoadingSpecialties] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      cnpj: initialData?.cnpj || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      zip_code: initialData?.zip_code || "",
      description: initialData?.description || "",
      website: initialData?.website || "",
      logo: initialData?.logo || "",
      cover_image: initialData?.cover_image || "",
      specialties: initialData?.specialties || [],
    },
  })

  useEffect(() => {
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

    fetchSpecialties()
  }, [toast])

  const handleSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      await onSubmit(data)
      toast({
        title: "Sucesso",
        description: "Clínica salva com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a clínica",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Nova Clínica</CardTitle>
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
                      <FormLabel>Nome da Clínica</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome da clínica" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o CNPJ" {...field} />
                      </FormControl>
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

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite a descrição da clínica"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="Digite o website" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidades</FormLabel>
                    <Select
                      disabled={loadingSpecialties}
                      onValueChange={(value) => {
                        const currentValues = field.value || []
                        if (!currentValues.includes(value)) {
                          field.onChange([...currentValues, value])
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione as especialidades" />
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
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value?.map((specialtyId) => {
                        const specialty = specialties.find((s) => s.id === specialtyId)
                        return specialty ? (
                          <Badge
                            key={specialtyId}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {specialty.name}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0"
                              onClick={() => {
                                field.onChange(
                                  field.value?.filter((id) => id !== specialtyId)
                                )
                              }}
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remover especialidade</span>
                            </Button>
                          </Badge>
                        ) : null
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

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