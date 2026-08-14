"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense, useRef } from "react"
import Image from "next/image"
import { AlertCircle } from "lucide-react"

function LoginContent() {
    const { signInWithGoogle, user, isAdmin, loading } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!loading && user) {
            if (isAdmin) {
                router.push('/admin')
            } else {
                setError("Your account is not authorized as an admin. Please contact the system administrator.")
            }
        }
    }, [user, isAdmin, loading, router])

    useEffect(() => {
        if (searchParams.get('error') === 'unauthorized') {
            setError("You do not have permission to access the admin dashboard.")
        }
    }, [searchParams])

    const handleLogin = async () => {
        try {
            setError(null)
            await signInWithGoogle()
        } catch (e: any) {
            setError(e.message || "Failed to sign in. Please try again.")
        }
    }

    // WebGL animation
    useEffect(() => {
        let active = true;
        let renderer: any;
        let geometry: any;
        let material: any;
        let scene: any;
        let camera: any;
        let animationId: number;

        const initThree = (THREE: any) => {
            if (!canvasRef.current || !active) return;
            const canvas = canvasRef.current;
            renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);

            scene = new THREE.Scene();
            camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

            const uniforms = {
                u_time: { value: 0 },
                u_resolution: { value: new THREE.Vector2(window.innerWidth * 2, window.innerHeight * 2) },
                u_opacities: { value: [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1.0] },
                u_colors: { value: [
                    new THREE.Vector3(1, 1, 1),
                    new THREE.Vector3(1, 1, 1),
                    new THREE.Vector3(1, 1, 1),
                    new THREE.Vector3(1, 1, 1),
                    new THREE.Vector3(1, 1, 1),
                    new THREE.Vector3(1, 1, 1)
                ] },
                u_total_size: { value: 20.0 },
                u_dot_size: { value: 6.0 },
                u_reverse: { value: 0 }
            };

            material = new THREE.ShaderMaterial({
                vertexShader: `
                    precision mediump float;
                    uniform vec2 u_resolution;
                    out vec2 fragCoord;
                    void main() {
                        gl_Position = vec4(position, 1.0);
                        fragCoord = (position.xy + 1.0) * 0.5 * u_resolution;
                        fragCoord.y = u_resolution.y - fragCoord.y;
                    }
                `,
                fragmentShader: `
                    precision mediump float;
                    in vec2 fragCoord;

                    uniform float u_time;
                    uniform float u_opacities[10];
                    uniform vec3 u_colors[6];
                    uniform float u_total_size;
                    uniform float u_dot_size;
                    uniform vec2 u_resolution;
                    uniform int u_reverse;

                    out vec4 fragColor;

                    float PHI = 1.61803398874989484820459;
                    float random(vec2 xy) {
                        return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
                    }

                    void main() {
                        vec2 st = fragCoord.xy;
                        st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
                        st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

                        float opacity = step(0.0, st.x) * step(0.0, st.y);

                        vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

                        float frequency = 5.0;
                        float show_offset = random(st2);
                        float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
                        opacity *= u_opacities[int(rand * 10.0)];
                        opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
                        opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

                        vec3 color = u_colors[int(show_offset * 6.0)];

                        float animation_speed_factor = 3.0;
                        vec2 center_grid = u_resolution / 2.0 / u_total_size;
                        float dist_from_center = distance(center_grid, st2);

                        float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);

                        float current_timing_offset = timing_offset_intro;
                        opacity *= step(current_timing_offset, u_time * animation_speed_factor);
                        opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);

                        fragColor = vec4(color, opacity);
                        fragColor.rgb *= fragColor.a;
                    }
                `,
                uniforms: uniforms,
                glslVersion: THREE.GLSL3,
                blending: THREE.CustomBlending,
                blendSrc: THREE.SrcAlphaFactor,
                blendDst: THREE.OneFactor,
                transparent: true
            });

            geometry = new THREE.PlaneGeometry(2, 2);
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);

            const startTime = performance.now();
            const animate = () => {
                if (!active) return;
                animationId = requestAnimationFrame(animate);
                uniforms.u_time.value = (performance.now() - startTime) / 1000.0;
                renderer.render(scene, camera);
            };
            animate();

            const handleResize = () => {
                renderer.setSize(window.innerWidth, window.innerHeight);
                uniforms.u_resolution.value.set(window.innerWidth * 2, window.innerHeight * 2);
            };
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
            };
        };

        if ((window as any).THREE) {
            const cleanUp = initThree((window as any).THREE);
            return () => {
                active = false;
                if (cleanUp) cleanUp();
                if (animationId) cancelAnimationFrame(animationId);
                if (renderer) renderer.dispose();
                if (geometry) geometry.dispose();
                if (material) material.dispose();
            };
        } else {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
            script.async = true;
            script.onload = () => {
                if ((window as any).THREE) {
                    initThree((window as any).THREE);
                }
            };
            document.head.appendChild(script);
        }

        return () => {
            active = false;
            if (animationId) cancelAnimationFrame(animationId);
            if (renderer) renderer.dispose();
            if (geometry) geometry.dispose();
            if (material) material.dispose();
        };
    }, []);

    const socialBtn: React.CSSProperties = {
        width:"100%", padding:"0.65rem", borderRadius:6,
        border:"1px solid #333", background:"transparent", color:"#fff",
        fontWeight:500, fontSize:"0.875rem", cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem",
        transition: "background 0.2s"
    };

    const GoogleIcon = (
        <svg viewBox="0 0 24 24" style={{width:16,height:16,flexShrink:0}}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
    );

    const Logo = (
        <div style={{width: 80, height: 80, marginBottom: "1.5rem", position: "relative"}}>
            <Image src="/ppc-logo.png" alt="PPC Logo" fill style={{objectFit: "contain"}} priority />
        </div>
    );

    return (
        <div style={{position:"relative",width:"100%",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:"#000",color:"#fff",fontFamily:"'Inter',-apple-system,sans-serif"}}>
            {/* WebGL Dot canvas */}
            <canvas ref={canvasRef} style={{position:"absolute",inset:0,zIndex:0}}/>

            {/* Vignette */}
            <div style={{position:"absolute",inset:0,zIndex:1,background:"radial-gradient(circle at center,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0) 100%)",pointerEvents:"none"}}/>

            {/* Modal card */}
            <div style={{position:"relative",zIndex:2,background:"#121212",borderRadius:12,padding:"3rem 2rem",width:"100%",maxWidth:400,boxShadow:"0 10px 40px rgba(0,0,0,0.8)",display:"flex",flexDirection:"column",alignItems:"center",border:"1px solid #222"}}>
                <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
                    {Logo}
                    <h1 style={{fontSize:"1.35rem",fontWeight:600,marginBottom:"0.25rem",letterSpacing:"-0.025em"}}>Admin Access</h1>
                    <p style={{fontSize:"0.85rem",color:"#888",marginBottom:"2rem",lineHeight:1.5}}>Sign in to manage PPC Open Play sessions.</p>

                    {error && (
                        <div style={{width: "100%", padding: "0.75rem", fontSize: "0.85rem", color: "#f87171", background: "rgba(248, 113, 113, 0.1)", borderRadius: 6, border: "1px solid rgba(248, 113, 113, 0.2)", display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "1.5rem", textAlign: "left"}}>
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button 
                        style={{...socialBtn, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer"}} 
                        onClick={handleLogin}
                        disabled={loading}
                        className="hover:bg-zinc-800"
                    >
                        {GoogleIcon}Continue with Google
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#000",color:"#fff"}}>Loading...</div>}>
            <LoginContent />
        </Suspense>
    )
}
