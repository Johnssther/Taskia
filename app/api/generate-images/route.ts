import { NextRequest, NextResponse } from 'next/server';

/**
 * Obtiene un access token de Google Cloud
 * Soporta: access token directo, service account key, o Application Default Credentials
 */
async function getAccessToken(apiKey?: string): Promise<string> {
  // Si se proporciona un access token directo
  if (apiKey) {
    // Si es un token de acceso (empieza con ya29. o es un Bearer token)
    if (apiKey.startsWith('ya29.') || apiKey.startsWith('Bearer ')) {
      return apiKey.replace('Bearer ', '');
    }
    
    // Si es una service account key JSON, necesitamos obtener un token
    try {
      const serviceAccount = JSON.parse(apiKey);
      // Para obtener token desde service account, necesitamos hacer una llamada OAuth2
      // Esto requiere la librería google-auth-library, pero por ahora usamos un enfoque simplificado
      // En producción, deberías usar: const { GoogleAuth } = require('google-auth-library');
      throw new Error('Service Account Key requiere la librería google-auth-library. Por ahora, usa un access token o Application Default Credentials.');
    } catch (parseError) {
      // Si no es JSON válido, asumir que es un token directo
      return apiKey;
    }
  }

  // Intentar usar Application Default Credentials
  // En servidores de Google Cloud o con gcloud auth application-default login configurado
  // Esto requiere que el entorno tenga GOOGLE_APPLICATION_CREDENTIALS configurado
  // o que se haya ejecutado: gcloud auth application-default login
  
  // Para desarrollo local, el usuario debe ejecutar:
  // gcloud auth application-default login
  // O configurar GOOGLE_APPLICATION_CREDENTIALS apuntando a un archivo de service account
  
  throw new Error('No se proporcionó autenticación. Opciones:\n' +
    '1. Envía un access token en el campo "apiKey"\n' +
    '2. Configura GOOGLE_APPLICATION_CREDENTIALS apuntando a un archivo de service account\n' +
    '3. Ejecuta: gcloud auth application-default login (para desarrollo local)');
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, apiKey, projectId, region, model, aspectRatio, sampleCount, addWatermark, enhancePrompt } = await request.json();

    // Validar prompt
    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: 'El prompt es requerido' },
        { status: 400 }
      );
    }

    // Obtener configuración de Google Cloud
    // Prioridad: parámetros del request > variables de entorno
    const googleProjectId = projectId || process.env.GOOGLE_CLOUD_PROJECT_ID;
    const googleRegion = region || process.env.GOOGLE_CLOUD_REGION || 'us-central1';
    const imagenModel = model || process.env.IMAGEN_MODEL || 'imagen-4.0-generate-001';
    
    // Obtener access token
    const accessTokenFromEnv = process.env.GOOGLE_ACCESS_TOKEN;
    const accessToken = await getAccessToken(apiKey || accessTokenFromEnv);

    if (!googleProjectId) {
      return NextResponse.json(
        { error: 'Google Cloud Project ID no configurado. Configura GOOGLE_CLOUD_PROJECT_ID en las variables de entorno o envíalo en el request.' },
        { status: 400 }
      );
    }

    // Validar sampleCount
    const imageCount = Math.min(Math.max(sampleCount || 1, 1), 4); // Entre 1 y 4

    // Preparar el request para Vertex AI
    const vertexAiUrl = `https://${googleRegion}-aiplatform.googleapis.com/v1/projects/${googleProjectId}/locations/${googleRegion}/publishers/google/models/${imagenModel}:predict`;

    const requestBody = {
      instances: [
        {
          prompt: prompt.trim()
        }
      ],
      parameters: {
        sampleCount: imageCount,
        aspectRatio: aspectRatio || '1:1',
        addWatermark: addWatermark !== undefined ? addWatermark : true,
        enhancePrompt: enhancePrompt !== undefined ? enhancePrompt : true,
      }
    };

    // Llamar a la API de Vertex AI
    const response = await fetch(vertexAiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error de Vertex AI:', errorData);
      
      // Mensajes de error más descriptivos
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Autenticación fallida. Verifica tu access token o credenciales de Google Cloud.' },
          { status: 401 }
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Permisos insuficientes. Asegúrate de que tu cuenta tenga acceso a Vertex AI API.' },
          { status: 403 }
        );
      }
      
      throw new Error(errorData.error?.message || `Error de Vertex AI: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Procesar las imágenes generadas
    const predictions = data.predictions || [];
    
    if (predictions.length === 0) {
      return NextResponse.json(
        { error: 'No se generaron imágenes. El modelo puede haber filtrado el contenido por políticas de seguridad.' },
        { status: 500 }
      );
    }

    // Convertir las imágenes base64 a URLs de datos o mantenerlas como base64
    const images = predictions.map((prediction: any, index: number) => ({
      id: index + 1,
      mimeType: prediction.mimeType || 'image/png',
      base64: prediction.bytesBase64Encoded,
      dataUrl: `data:${prediction.mimeType || 'image/png'};base64,${prediction.bytesBase64Encoded}`,
      enhancedPrompt: prediction.prompt || null, // Si el modelo mejoró el prompt
    }));

    return NextResponse.json({
      images,
      count: images.length,
      model: imagenModel,
      prompt: prompt,
      metadata: {
        projectId: googleProjectId,
        region: googleRegion,
        aspectRatio: aspectRatio || '1:1',
        sampleCount: imageCount,
        addWatermark: addWatermark !== undefined ? addWatermark : true,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error generating images:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al generar imágenes';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
