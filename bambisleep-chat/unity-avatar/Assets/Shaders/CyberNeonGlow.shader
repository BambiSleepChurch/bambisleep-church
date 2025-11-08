// 🌸 CyberNeonGothWave Glow Shader
// Custom shader for BambiSleep avatar materials
// Provides neon emission, rim lighting, and dynamic color shifts

Shader "BambiSleep/CyberNeonGlow"
{
    Properties
    {
        _MainTex ("Albedo Texture", 2D) = "white" {}
        _Color ("Base Color", Color) = (1,1,1,1)
        
        // Emission (Neon Glow)
        _EmissionMap ("Emission Map", 2D) = "black" {}
        _EmissionColor ("Emission Color", Color) = (0, 0.941, 1, 1) // Cyber Cyan #00F0FF
        _EmissionIntensity ("Emission Intensity", Range(0, 10)) = 2.0
        
        // Rim Lighting (Cyber Glow)
        _RimColor ("Rim Color", Color) = (1, 0.063, 0.941, 1) // Neon Purple #FF10F0
        _RimPower ("Rim Power", Range(0.1, 10.0)) = 3.0
        _RimIntensity ("Rim Intensity", Range(0, 5)) = 1.5
        
        // Dynamic Color Shift
        _ColorShiftSpeed ("Color Shift Speed", Range(0, 5)) = 1.0
        _ColorShiftIntensity ("Color Shift Intensity", Range(0, 1)) = 0.3
        
        // Surface Properties
        _Glossiness ("Smoothness", Range(0, 1)) = 0.5
        _Metallic ("Metallic", Range(0, 1)) = 0.0
    }
    
    SubShader
    {
        Tags { "RenderType"="Opaque" "RenderPipeline"="UniversalPipeline" }
        LOD 200
        
        CGPROGRAM
        #pragma surface surf Standard fullforwardshadows
        #pragma target 3.0
        
        sampler2D _MainTex;
        sampler2D _EmissionMap;
        
        struct Input
        {
            float2 uv_MainTex;
            float3 viewDir;
            float3 worldPos;
        };
        
        half4 _Color;
        half4 _EmissionColor;
        half _EmissionIntensity;
        half4 _RimColor;
        half _RimPower;
        half _RimIntensity;
        half _ColorShiftSpeed;
        half _ColorShiftIntensity;
        half _Glossiness;
        half _Metallic;
        
        void surf (Input IN, inout SurfaceOutputStandard o)
        {
            // Base color
            fixed4 c = tex2D(_MainTex, IN.uv_MainTex) * _Color;
            o.Albedo = c.rgb;
            
            // Emission (Neon Glow)
            fixed4 emission = tex2D(_EmissionMap, IN.uv_MainTex) * _EmissionColor;
            
            // Dynamic color shift based on time
            float timeOffset = _Time.y * _ColorShiftSpeed;
            float3 colorShift = float3(
                sin(timeOffset) * _ColorShiftIntensity,
                sin(timeOffset + 2.094) * _ColorShiftIntensity, // 120 degrees offset
                sin(timeOffset + 4.189) * _ColorShiftIntensity  // 240 degrees offset
            );
            emission.rgb += colorShift;
            
            // Rim lighting (Cyber Glow)
            half rim = 1.0 - saturate(dot(normalize(IN.viewDir), o.Normal));
            rim = pow(rim, _RimPower);
            o.Emission = emission.rgb * _EmissionIntensity + (_RimColor.rgb * rim * _RimIntensity);
            
            // Surface properties
            o.Metallic = _Metallic;
            o.Smoothness = _Glossiness;
            o.Alpha = c.a;
        }
        ENDCG
    }
    
    FallBack "Diffuse"
}
