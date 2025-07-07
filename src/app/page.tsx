
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
import { Leaf, AlertCircle, Eye, EyeOff, Loader2, Mail, User, AtSign, Building2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { registerUserAction, requestPasswordResetAction } from "./actions/user-actions";
import { loginUserAction } from "./actions/auth-actions";
import type { UserArea } from "@/lib/types";
import { useCompanySettings } from "@/context/company-settings-context";
import { Textarea } from "@/components/ui/textarea";

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
  credential: z.string().min(1, { message: "El correo o usuario es requerido." }),
  area: z.enum(userAreas, { required_error: "Debes seleccionar tu área."}),
  details: z.string().min(10, { message: "Debes proporcionar un motivo de al menos 10 caracteres." }),
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
    defaultValues: { credential: "", details: "" },
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
    <div className="relative">
        <div className="fixed inset-0 z-0">
            {settings.login_bg_url ? (
                <Image
                    src={settings.login_bg_url}
                    alt="Fondo de inicio de sesión"
                    layout="fill"
                    objectFit="cover"
                    quality={100}
                />
            ) : (
                <div className="w-full h-full bg-slate-50"></div>
            )}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        </div>
    
        <main className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className={cn("w-full transition-all duration-300 ease-in-out", activeTab === 'login' ? 'max-w-sm' : 'max-w-md')}>
                <Card className={cn("z-10 bg-black/80 backdrop-blur-lg border border-white/20 shadow-2xl", activeTab === 'login' ? 'max-w-sm' : 'max-w-md')}>
                    <CardHeader className="text-center">
                        <div className="flex justify-center items-center gap-3 mb-4">
                            {settings.logo_url ? (
                            <Image src={settings.logo_url} alt="Logo Empresa" width={48} height={48} className="h-12 w-12 object-contain" />
                            ) : (
                            <Leaf className="h-12 w-12 text-primary" />
                            )}
                            <CardTitle className="text-3xl font-headline whitespace-nowrap text-white">Agro Norte Corp</CardTitle>
                        </div>
                        <TabsList className="grid w-full grid-cols-2 bg-gray-900/50">
                            <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-white text-gray-300">Iniciar Sesión</TabsTrigger>
                            <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-white text-gray-300">Registrar</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <TabsContent value="login">
                        <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                            <CardContent className="space-y-4">
                                <CardDescription className="text-center text-gray-400">Inicia sesión para acceder al sistema.</CardDescription>
                                {error && (
                                    <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 text-red-300 [&>svg]:text-red-300">
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
                                        <FormLabel className="text-gray-300">Correo o Usuario</FormLabel>
                                        <FormControl>
                                        <div className="relative">
                                            <AtSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Correo o Usuario" {...field} className="pl-8 bg-gray-900/50 border-gray-700 text-gray-200 focus:border-primary" />
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
                                        <FormLabel className="text-gray-300">Contraseña</FormLabel>
                                        <FormControl>
                                        <div className="relative">
                                            <Input type={showPassword ? "text" : "password"} placeholder="Tu contraseña" {...field} className="bg-gray-900/50 border-gray-700 text-gray-200 focus:border-primary" />
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
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="border-gray-500" /></FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="font-normal cursor-pointer text-gray-300">Recordar sesión</FormLabel>
                                        </div>
                                        </FormItem>
                                    )}
                                    />
                                    <Button type="button" variant="link" className="p-0 h-auto font-normal text-primary hover:text-primary/80" onClick={() => setForgotPasswordOpen(true)}>
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
                            <CardContent className="space-y-3">
                                <CardDescription className="text-center text-gray-400">Tu solicitud será revisada por un administrador.</CardDescription>
                                {error && (
                                    <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 text-red-300 [&>svg]:text-red-300">
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
                                            <FormLabel className="text-gray-300">Nombre</FormLabel>
                                            <FormControl>
                                            <Input placeholder="Tu nombre" {...field} className="bg-gray-900/50 border-gray-700 text-gray-200 focus:border-primary"/>
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
                                            <FormLabel className="text-gray-300">Apellidos</FormLabel>
                                            <FormControl>
                                            <Input placeholder="Tus apellidos" {...field} className="bg-gray-900/50 border-gray-700 text-gray-200 focus:border-primary"/>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={registerForm.control}
                                        name="username"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-300">Nombre de Usuario</FormLabel>
                                            <FormControl>
                                            <div className="relative">
                                                <AtSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="usuario" {...field} className="pl-8 bg-gray-900/50 border-gray-700 text-gray-200 focus:border-primary" />
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
                                            <FormLabel className="text-gray-300">Correo Electrónico</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input type="email" placeholder="correo" {...field} className="pl-8 bg-gray-900/50 border-gray-700 text-gray-200 focus:border-primary"/>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={registerForm.control}
                                    name="area"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-300">Área</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <div className="relative">
                                            <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <SelectTrigger className="pl-8 bg-gray-900/50 border-gray-700 text-gray-200 focus:border-primary">
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
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={registerForm.control}
                                        name="password"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-300">Contraseña</FormLabel>
                                            <FormControl><Input type="password" placeholder="Crea una contraseña segura" {...field} className="bg-gray-900/50 border-gray-700 text-gray-200 focus:border-primary"/></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={registerForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-300">Confirmar Contraseña</FormLabel>
                                            <FormControl><Input type="password" placeholder="Repite la contraseña" {...field} className="bg-gray-900/50 border-gray-700 text-gray-200 focus:border-primary"/></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
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
        </main>
        
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
                                    <div className="relative">
                                        <AtSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Tu correo o usuario" {...field} className="pl-8"/>
                                    </div>
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
    </div>
  );
}
