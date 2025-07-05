
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, AlertCircle, Eye, EyeOff, Loader2, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginFormSchema = z.object({
  username: z.string().min(1, { message: "El usuario es requerido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
  rememberMe: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const registerFormSchema = z.object({
  username: z.string().min(3, { message: "El usuario debe tener al menos 3 caracteres." }),
  whatsappNumber: z.string().min(9, { message: "El número de WhatsApp debe tener al menos 9 dígitos." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

const forgotPasswordSchema = z.object({
  username: z.string().min(1, { message: "El usuario para recuperar es requerido." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [backgroundUrl, setBackgroundUrl] = React.useState<string>('');
  const [logoUrl, setLogoUrl] = React.useState<string>('');
  const [isCompanySettingsLoading, setCompanySettingsLoading] = React.useState(true);
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isForgotPasswordOpen, setForgotPasswordOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("login");

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { username: "", password: "", rememberMe: false },
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { username: "", whatsappNumber: "", password: "", confirmPassword: "" },
  });
  
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { username: "" },
  });

  React.useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('agronorte-company-settings');
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        if (settings.loginBackgroundUrl) {
            setBackgroundUrl(settings.loginBackgroundUrl);
        }
        if (settings.logoUrl) {
            setLogoUrl(settings.logoUrl);
        }
      }
    } catch (error) {
      console.error('Failed to load company settings', error);
    } finally {
        setCompanySettingsLoading(false);
    }
  }, []);

  const handleLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (data.username === "Gabriel T" && data.password === "003242373") {
      toast({ title: "Inicio de Sesión Exitoso", description: "Bienvenido de vuelta." });
      router.push("/dashboard");
    } else {
      setError("Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.");
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // En una aplicación real, esto crearía un usuario con estado 'pendiente'
    // y notificaría al administrador para su aprobación.
    console.log("Solicitud de registro:", data);
    
    toast({ 
      title: "Solicitud de Registro Enviada", 
      description: "Tu solicitud ha sido enviada. Un administrador la revisará y activará tu cuenta pronto." 
    });

    setIsLoading(false);
    registerForm.reset();
    setActiveTab("login"); // Volver a la pestaña de inicio de sesión
  };
  
  const onForgotPasswordSubmit = (data: ForgotPasswordFormValues) => {
    console.log("Forgot password for:", data.username);
    toast({
      title: "Solicitud Enviada",
      description: `Se ha enviado una solicitud al administrador para restablecer la contraseña del usuario ${data.username}.`,
    });
    setForgotPasswordOpen(false);
    forgotPasswordForm.reset();
  }

  const backgroundStyle = backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : {};

  return (
    <main 
        className="flex items-center justify-center min-h-screen bg-slate-50 p-4 bg-cover bg-center transition-all duration-500"
        style={backgroundStyle}
    >
        {backgroundUrl && <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-sm">
            <Card className="z-10 bg-white/95 dark:bg-black/80 backdrop-blur-lg border border-white/20 shadow-2xl">
                <CardHeader className="text-center">
                    <div className="flex justify-center items-center gap-3 mb-4">
                        {isCompanySettingsLoading || !logoUrl ? (
                            <Leaf className="h-12 w-12 text-primary" />
                        ) : (
                            <img src={logoUrl} alt="Logo de la empresa" className="h-12 w-12 object-contain" />
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
                                name="username"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Usuario</FormLabel>
                                    <FormControl><Input placeholder="Tu nombre de usuario" {...field} /></FormControl>
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
                                        <FormLabel className="font-normal cursor-pointer">Guardar contraseña</FormLabel>
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
                    <form onSubmit={registerForm.handleSubmit(handleRegister)}>
                        <CardContent className="space-y-4">
                            <CardDescription className="text-center">Tu solicitud será revisada por un administrador.</CardDescription>
                            <FormField
                                control={registerForm.control}
                                name="username"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Usuario</FormLabel>
                                    <FormControl><Input placeholder="Elige un nombre de usuario" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={registerForm.control}
                                name="whatsappNumber"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número de WhatsApp</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input type="tel" placeholder="987654321" {...field} className="pl-8"/>
                                        </div>
                                    </FormControl>
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
                    Ingresa tu nombre de usuario. Se enviará una solicitud al administrador para restablecer tu contraseña.
                    </DialogDescription>
                </DialogHeader>
                <Form {...forgotPasswordForm}>
                    <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={forgotPasswordForm.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nombre de Usuario</FormLabel>
                                <FormControl>
                                    <Input placeholder="Tu nombre de usuario" {...field} />
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
