import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Building2, Users, TrendingUp, Shield } from "lucide-react";
import { z } from "zod";

import { ThemeToggle } from "@/components/ThemeToggle";

const emailSchema = z.string().email("Email inválido");
const passwordSchema = z.string().min(6, "Senha deve ter no mínimo 6 caracteres");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              variant: "destructive",
              title: "Credenciais inválidas",
              description: "Email ou senha incorretos. Tente novamente.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Erro no login",
              description: error.message,
            });
          }
          return;
        }

        toast({
          title: "Bem-vindo de volta!",
          description: "Login realizado com sucesso.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              variant: "destructive",
              title: "Email já cadastrado",
              description: "Este email já está em uso. Tente fazer login.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Erro no cadastro",
              description: error.message,
            });
          }
          return;
        }

        toast({
          title: "Conta criada!",
          description: "Cadastro realizado com sucesso.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Ocorreu um erro. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao entrar com Google",
          description: error.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Não foi possível conectar com o Google. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { icon: Building2, value: "500+", label: "Empresas" },
    { icon: Users, value: "2M+", label: "Colaboradores" },
    { icon: TrendingUp, value: "R$8B", label: "Gerenciados/ano" },
    { icon: Shield, value: "99.9%", label: "Uptime" },
  ];

  return (
    <div className="min-h-screen flex relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-secondary via-background to-accent/10">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-accent/15 rounded-full blur-3xl animate-pulse-subtle" />
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-accent/8 rounded-full blur-3xl animate-pulse-subtle animation-delay-300" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-primary-foreground/5 rounded-full blur-3xl animate-float" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.07) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.07) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Logo - Triplicado em tamanho */}
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-foreground font-sans tracking-tight drop-shadow-2xl">
              BenefitOS<span className="text-accent">.</span>
            </span>
          </div>

          {/* Main content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-lg font-bold text-foreground leading-tight">
                O Sistema Operacional
                <span className="text-gradient block mt-3">do RH Moderno</span>
              </h1>
              <p className="text-lg text-foreground/70 max-w-lg leading-relaxed">
                Centralize todos os benefícios corporativos em uma única plataforma inteligente. 
                Automatize, analise e otimize a gestão de pessoas.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 max-w-lg">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="glass rounded-xl p-4 backdrop-blur-xl animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <stat.icon className="h-7 w-7 text-accent mb-3" />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-lg text-foreground/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-foreground/40 text-sm">
            © 2024 BenefitOS. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile logo - Triplicado */}
          <div className="lg:hidden flex justify-center mb-8">
            <span className="text-2xl font-bold text-foreground font-sans tracking-tight drop-shadow-xl">
              BenefitOS<span className="text-accent">.</span>
            </span>
          </div>

          <div className="text-center space-y-3">
            <h2 className="text-lg font-bold text-foreground">
              {isLogin ? "Bem-vindo de volta" : "Criar sua conta"}
            </h2>
            <p className="text-base text-muted-foreground">
              {isLogin 
                ? "Acesse sua plataforma de benefícios" 
                : "Comece a transformar sua gestão de benefícios"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    className="pl-10 h-12 bg-muted/50 border-border focus:border-accent focus:ring-accent input-focus"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    className="pl-10 pr-10 h-12 bg-muted/50 border-border focus:border-accent focus:ring-accent input-focus"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-accent hover:text-accent/80 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 btn-premium rounded-lg text-base font-semibold"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  {isLogin ? "Entrando..." : "Criando conta..."}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isLogin ? "Entrar" : "Criar conta"}
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  ou continue com
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full h-12 bg-muted/50 border-border hover:bg-muted hover:border-accent/50 transition-all"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continuar com Google
            </Button>
          </form>

          <div className="text-center">
            <p className="text-muted-foreground">
              {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-accent hover:text-accent/80 font-medium transition-colors"
              >
                {isLogin ? "Criar conta" : "Fazer login"}
              </button>
            </p>
          </div>

          {/* Trust badges */}
          <div className="pt-8 border-t border-border">
            <div className="flex items-center justify-center gap-6 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                <span>LGPD Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-accent" />
                <span>Criptografia 256-bit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
