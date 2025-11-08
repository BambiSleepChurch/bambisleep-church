// 🌸 Particle Energy Trail Shader
// For particle systems that follow avatar movements
// Cyan → Purple gradient with glow

Shader "BambiSleep/ParticleEnergyTrail"
{
    Properties
    {
        _MainTex ("Particle Texture", 2D) = "white" {}
        _ColorStart ("Start Color", Color) = (0, 1, 0.831, 1) // Aqua Glow #00FFD4
        _ColorEnd ("End Color", Color) = (1, 0.063, 0.941, 1) // Neon Purple #FF10F0
        _Brightness ("Brightness", Range(0, 10)) = 3.0
        _GlowIntensity ("Glow Intensity", Range(0, 5)) = 2.0
    }
    
    SubShader
    {
        Tags { "Queue"="Transparent" "RenderType"="Transparent" "IgnoreProjector"="True" }
        Blend SrcAlpha OneMinusDstAlpha
        ZWrite Off
        Cull Off
        
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_particles
            
            #include "UnityCG.cginc"
            
            struct appdata_t
            {
                float4 vertex : POSITION;
                float4 color : COLOR;
                float2 texcoord : TEXCOORD0;
            };
            
            struct v2f
            {
                float4 vertex : SV_POSITION;
                fixed4 color : COLOR;
                float2 texcoord : TEXCOORD0;
            };
            
            sampler2D _MainTex;
            float4 _MainTex_ST;
            fixed4 _ColorStart;
            fixed4 _ColorEnd;
            half _Brightness;
            half _GlowIntensity;
            
            v2f vert (appdata_t v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.color = v.color;
                o.texcoord = TRANSFORM_TEX(v.texcoord, _MainTex);
                return o;
            }
            
            fixed4 frag (v2f i) : SV_Target
            {
                // Sample texture
                fixed4 col = tex2D(_MainTex, i.texcoord);
                
                // Gradient based on particle life (stored in vertex color)
                fixed4 gradient = lerp(_ColorStart, _ColorEnd, i.color.a);
                
                // Apply glow
                col.rgb = col.rgb * gradient.rgb * _Brightness * _GlowIntensity;
                col.a *= gradient.a * i.color.a;
                
                return col;
            }
            ENDCG
        }
    }
}
