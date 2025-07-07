
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, AlertCircle, Eye, EyeOff, Loader2, Mail, User, AtSign, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { registerUserAction } from "./actions/user-actions";
import { loginUserAction } from "./actions/auth-actions";
import type { UserArea } from "@/lib/types";
import { useCompanySettings } from "@/context/company-settings-context";

const userAreas: UserArea[] = ['Gerencia', 'Logística', 'RR.HH', 'Seguridad Patrimonial', 'Almacén', 'Taller', 'Producción', 'Sanidad', 'SS.GG'];

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
  area: z.enum(userAreas, { required_error: "Debes seleccionar tu área."}),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "El correo para recuperar es requerido." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { settings } = useCompanySettings();
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isForgotPasswordOpen, setForgotPasswordOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("login");

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { credential: "", password: "", rememberMe: false },
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: "", last_name: "", username: "", email: "", area: undefined, password: "", confirmPassword: "" },
  });
  
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const handleLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    const result = await loginUserAction(data);
    
    setIsLoading(false);

    if (result.success) {
      toast({ title: "Inicio de Sesión Exitoso", description: "Bienvenido de vuelta." });
      router.push("/dashboard");
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
        setActiveTab("login");
    } else {
        setError(result.message || "No se pudo completar el registro.");
    }
  };
  
  const onForgotPasswordSubmit = (data: ForgotPasswordFormValues) => {
    console.log("Forgot password for:", data.email);
    toast({
      title: "Solicitud Enviada",
      description: `Se ha enviado una solicitud al administrador para restablecer la contraseña del usuario con correo ${data.email}.`,
    });
    setForgotPasswordOpen(false);
    forgotPasswordForm.reset();
  }

  return (
    <main 
        className="flex items-center justify-center min-h-screen bg-slate-50 p-4 bg-cover bg-center transition-all duration-500"
    >
        {settings.login_bg_url && (
          <Image
            src={settings.login_bg_url}
            alt="Fondo de inicio de sesión"
            layout="fill"
            objectFit="cover"
            quality={100}
            className="z-0"
          />
        )}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-sm">
            <Card className="z-10 bg-white/95 dark:bg-black/80 backdrop-blur-lg border border-white/20 shadow-2xl">
                <CardHeader className="text-center">
                    <div className="flex justify-center items-center gap-3 mb-4">
                        {settings.logo_url ? (
                          <Image src={settings.logo_url} alt="Logo Empresa" width={48} height={48} className="h-12 w-12 object-contain" />
                        ) : (
                          <Leaf className="h-12 w-12 text-primary" />
                        )}
                        <CardTitle className="text-3xl font-headline whitespace-nowrap">Agro Norte Corp</CardTitle>
                    </div>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                        <TabsTrigger value="register">Registrar</TabsTrigger>
                    </TabsList>
                </CardHeader>
                <TabsContent value="login">
                    <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                        <CardContent className="space-y-4">
                            <CardDescription className="text-center">Inicia sesión para acceder al sistema.</CardDescription>
                            {error && (
                                <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error de Autenticación</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <FormField
                                control={loginForm.control}
                                name="credential"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correo o Usuario</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                          <AtSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                          <Input placeholder="Correo o Usuario" {...field} className="pl-8" />
                                      </div>
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
                                    <div className="relative">
                                        <Input type={showPassword ? "text" : "password"} placeholder="Tu contraseña" {...field} />
                                        <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="flex items-center justify-between text-sm mt-2">
                                <FormField
                                control={loginForm.control}
                                name="rememberMe"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="font-normal cursor-pointer">Recordar sesión</FormLabel>
                                    </div>
                                    </FormItem>
                                )}
                                />
                                <Button type="button" variant="link" className="p-0 h-auto font-normal text-primary" onClick={() => setForgotPasswordOpen(true)}>
                                    Recuperar contraseña
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Iniciar Sesión'}
                            </Button>
                        </CardFooter>
                    </form>
                    </Form>
                </TabsContent>
                <TabsContent value="register">
                     <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                        <CardContent className="space-y-4">
                            <CardDescription className="text-center">Tu solicitud será revisada por un administrador.</CardDescription>
                            {error && (
                                <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error en el Registro</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                             <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={registerForm.control}
                                    name="name"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl>
                                        <Input placeholder="Tu nombre" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={registerForm.control}
                                    name="last_name"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Apellidos</FormLabel>
                                        <FormControl>
                                        <Input placeholder="Tus apellidos" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                             </div>
                             <FormField
                                control={registerForm.control}
                                name="username"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre de Usuario</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <AtSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="usuario" {...field} className="pl-8" />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={registerForm.control}
                                name="email"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correo Electrónico</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input type="email" placeholder="correo" {...field} className="pl-8"/>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={registerForm.control}
                                name="area"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Área</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <div className="relative">
                                        <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <SelectTrigger className="pl-8">
                                            <SelectValue placeholder="Selecciona tu área..." />
                                        </SelectTrigger>
                                      </div>
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
                                control={registerForm.control}
                                name="password"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contraseña</FormLabel>
                                    <FormControl><Input type="password" placeholder="Crea una contraseña segura" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={registerForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirmar Contraseña</FormLabel>
                                    <FormControl><Input type="password" placeholder="Repite la contraseña" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Solicitar Registro'}
                            </Button>
                        </CardFooter>
                    </form>
                    </Form>
                </TabsContent>
            </Card>
        </Tabs>
        
        <Dialog open={isForgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Recuperar Contraseña</DialogTitle>
                    <DialogDescription>
                    Ingresa tu correo electrónico. Se enviará una solicitud al administrador para restablecer tu contraseña.
                    </DialogDescription>
                </DialogHeader>
                <Form {...forgotPasswordForm}>
                    <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={forgotPasswordForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Correo Electrónico</FormLabel>
                                <FormControl>
                                    <Input placeholder="tu@correo.com" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setForgotPasswordOpen(false)}>Cancelar</Button>
                            <Button type="submit">Enviar Solicitud</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    </main>
  );
}
