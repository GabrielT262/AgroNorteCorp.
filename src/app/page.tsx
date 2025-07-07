
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { registerUserAction, requestPasswordResetAction } from "./actions/user-actions";
import { loginUserAction } from "./actions/auth-actions";
import type { UserArea } from "@/lib/types";
import { useCompanySettings } from "@/context/company-settings-context";
import { Textarea } from "@/components/ui/textarea";

const userAreas: UserArea[] = ['Gerencia', 'Logística', 'RR.HH', 'Seguridad Patrimonial', 'Almacén', 'Taller', 'Producción', 'Sanidad', 'SS.GG', 'Administrador'];

const loginFormSchema = z.object({
  credential: z.string().min(1, { message: "Por favor, introduce tu correo o usuario." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
  rememberMe: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;


const registerFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  last_name: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres." }),
  username: z.string().min(3, { message: "El usuario debe tener al menos 3 caracteres." }).regex(/^[a-zA-Z0-9_.-]+$/, "Solo letras, números, puntos, guiones y guiones bajos."),
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  whatsapp_number: z.string().min(9, { message: "El número debe tener al menos 9 dígitos." }),
  area: z.enum(userAreas, { required_error: "Debes seleccionar tu área."}),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

const forgotPasswordSchema = z.object({
  credential: z.string().min(1, { message: "El correo o usuario es requerido." }),
  area: z.enum(userAreas, { required_error: "Debes seleccionar tu área."}),
  details: z.string().min(10, { message: "Debes proporcionar un motivo de al menos 10 caracteres." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { settings } = useCompanySettings();
  
  const [activeTab, setActiveTab] = React.useState('login');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isForgotPasswordOpen, setForgotPasswordOpen] = React.useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { credential: "", password: "", rememberMe: false },
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: "", last_name: "", username: "", email: "", whatsapp_number: "", area: undefined, password: "", confirmPassword: "" },
  });
  
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { credential: "", details: "" },
  });

  const handleLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    const result = await loginUserAction(data);
    setIsLoading(false);
    if (result.success && result.userId) {
      toast({ title: "Inicio de Sesión Exitoso", description: "Bienvenido de vuelta." });
      router.push(`/dashboard?userId=${result.userId}`);
    } else {
      setError(result.message || "Credenciales incorrectas. Por favor, inténtalo de nuevo.");
    }
  };

  const handleRegister = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    const result = await registerUserAction({
      name: data.name,
      last_name: data.last_name,
      username: data.username,
      email: data.email,
      whatsapp_number: data.whatsapp_number,
      area: data.area,
      password: data.password,
    });
    setIsLoading(false);
    if (result.success) {
        toast({ 
          title: "Solicitud de Registro Enviada", 
          description: "Tu solicitud ha sido enviada. Un administrador la revisará y activará tu cuenta pronto." 
        });
        registerForm.reset();
        setActiveTab('login');
    } else {
        setError(result.message || "No se pudo completar el registro.");
    }
  };
  
  const onForgotPasswordSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    const result = await requestPasswordResetAction(data);
    setIsLoading(false);
    if (result.success) {
      toast({
        title: "Solicitud Enviada",
        description: `Se ha enviado una notificación al administrador. Se pondrán en contacto contigo pronto.`,
      });
      setForgotPasswordOpen(false);
      forgotPasswordForm.reset();
    } else {
       toast({
        title: "Error",
        description: result.message || 'No se pudo enviar la solicitud.',
        variant: "destructive"
      });
    }
  }

  return (
    <div className="w-full min-h-screen overflow-y-auto">
        <div className="fixed inset-0 z-0">
            {settings.login_bg_url ? (
                <Image
                    src={settings.login_bg_url}
                    alt="Fondo de inicio de sesión"
                    fill
                    objectFit="cover"
                    quality={100}
                    className="z-0"
                />
            ) : (
                <div className="w-full h-full bg-background z-0"></div>
            )}
        </div>
        
        <main className="relative z-10 flex items-start sm:items-center justify-center min-h-full sm:min-h-screen py-12 px-4">
            <Card className={cn(
                "bg-card/80 backdrop-blur-sm border-border/50 text-card-foreground transition-all duration-500 ease-in-out w-full",
                activeTab === 'register' ? 'max-w-2xl' : 'max-w-md'
            )}>
                <div className="flex flex-col h-full">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                        <div className="relative p-1 border-2 border-primary/50 bg-background/20 rounded-lg shadow-md h-20 w-20 overflow-hidden">
                            {settings.logo_url ? (
                            <Image src={settings.logo_url} alt="Logo de la Empresa" fill className="object-cover rounded-md"/>
                            ) : (
                            <Leaf className="h-full w-full text-primary p-2" />
                            )}
                        </div>
                        </div>
                        <CardTitle className="text-center text-4xl font-bold uppercase tracking-wider">
                           Agro Norte <span style={{ color: '#F6EA00' }}>Corp</span>
                        </CardTitle>
                        <CardDescription className="text-center pt-2">
                             <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                                    <TabsTrigger value="register">Registrarme</TabsTrigger>
                                </TabsList>
                             </Tabs>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <Tabs defaultValue="login" value={activeTab}>
                            <TabsContent value="login" className="mt-6">
                                <Form {...loginForm}>
                                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                                    {error && !isLoading && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-xs">{error}</AlertDescription>
                                    </Alert>
                                    )}
                                    <FormField
                                    control={loginForm.control}
                                    name="credential"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Correo o Usuario</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Correo o Usuario" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    <FormField
                                    control={loginForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Contraseña</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    <div className="flex items-center justify-between">
                                        <FormField
                                        control={loginForm.control}
                                        name="rememberMe"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                Recordar usuario
                                            </FormLabel>
                                            </FormItem>
                                        )}
                                        />
                                        <Button type="button" variant="link" onClick={() => setForgotPasswordOpen(true)} className="px-1 h-auto py-0 text-sm">
                                        ¿Olvidaste tu contraseña?
                                        </Button>
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Ingresar"}
                                    </Button>
                                </form>
                                </Form>
                            </TabsContent>

                            <TabsContent value="register" className="mt-6">
                                <Form {...registerForm}>
                                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                                    {error && !isLoading && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-xs">{error}</AlertDescription>
                                    </Alert>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={registerForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Nombre" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                        <FormField control={registerForm.control} name="last_name" render={({ field }) => ( <FormItem><FormLabel>Apellidos</FormLabel><FormControl><Input placeholder="Apellidos" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={registerForm.control} name="username" render={({ field }) => ( <FormItem><FormLabel>Usuario</FormLabel><FormControl><Input placeholder="Usuario" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                        <FormField control={registerForm.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Correo</FormLabel><FormControl><Input type="email" placeholder="Correo" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={registerForm.control} name="whatsapp_number" render={({ field }) => ( <FormItem><FormLabel>N° de WhatsApp</FormLabel><FormControl><Input placeholder="987654321" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                        <FormField control={registerForm.control} name="area" render={({ field }) => ( <FormItem><FormLabel>Área</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona tu área..." /></SelectTrigger></FormControl><SelectContent>{userAreas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={registerForm.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                        <FormField control={registerForm.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel>Confirmar Contraseña</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar Solicitud"}
                                    </Button>
                                </form>
                                </Form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </div>
            </Card>

            <Dialog open={isForgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Recuperar Contraseña</DialogTitle>
                        <DialogDescription>
                        Completa el formulario para enviar una solicitud de reseteo de contraseña a un administrador.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...forgotPasswordForm}>
                        <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={forgotPasswordForm.control}
                                name="credential"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Correo o Usuario</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Tu correo o usuario" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={forgotPasswordForm.control}
                                name="area"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Tu Área</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona tu área..." />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {userAreas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={forgotPasswordForm.control}
                                name="details"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Motivo de la Solicitud</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Ej: Olvidé mi contraseña, no puedo acceder." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setForgotPasswordOpen(false)} disabled={isLoading}>Cancelar</Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enviar Solicitud'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </main>
    </div>
  );
}
