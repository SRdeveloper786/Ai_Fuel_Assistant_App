import React, { useState } from "react";
import { Code, Copy, Check, Terminal, Cpu, MessageSquare, Mic } from "lucide-react";

export default function AndroidIntegrationGuide() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "http://your-server-url.com";

  const retrofitCode = `// 1. Add Retrofit dependencies in your build.gradle (Module: app)
// implementation("com.squareup.retrofit2:retrofit:2.9.0")
// implementation("com.squareup.retrofit2:converter-gson:2.9.0")

// 2. Define Data Models
data class ChatRequest(
    val message: String,
    val history: List<ChatMessageDto> = emptyList(),
    val vehicleProfile: VehicleDto? = null,
    val fuelLogs: List<FuelLogDto> = emptyList()
)

data class ChatMessageDto(val role: String, val text: String)
data class VehicleDto(val name: String, val type: String, val fuelType: String)
data class FuelLogDto(val date: String, val odometer: Double, val fuelFilled: Double, val totalCost: Double)

data class ChatResponse(
    val reply: String,
    val timestamp: String,
    val status: String
)

// 3. Create Retrofit API Interface
interface FuelAssistantService {
    @POST("/api/chat")
    suspend fun getAssistantReply(@Body request: ChatRequest): Response<ChatResponse>
}

// 4. Initialize Retrofit Client
object RetrofitClient {
    private const val BASE_URL = "${currentOrigin}" // Replace with your live URL

    val service: FuelAssistantService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(FuelAssistantService::class.java)
    }
}`;

  const voiceCode = `// Android Native Text-to-Speech (TTS) Implementation
class FuelAssistantActivity : AppCompatActivity(), TextToSpeech.OnInitListener {
    private lateinit var tts: TextToSpeech

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_fuel_assistant)

        // Initialize TTS
        tts = TextToSpeech(this, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            // Set language based on assistant response
            val result = tts.setLanguage(Locale("ur", "PK")) // For Urdu
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.e("TTS", "Language is not supported")
            }
        }
    }

    private fun speakOut(text: String) {
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "AssistantSpeechID")
    }

    override fun onDestroy() {
        if (::tts.isInitialized) {
            tts.stop()
            tts.shutdown()
        }
        super.onDestroy()
    }

    // Android Native Speech-to-Text (STT) Trigger
    private fun startSpeechToText() {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ur-PK") // Or "en-US", "hi-IN", "ar-SA"
            putExtra(RecognizerIntent.EXTRA_PROMPT, "Boliye, main sun raha hoon...")
        }
        try {
            startActivityForResult(intent, SPEECH_REQUEST_CODE)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(this, "Speech recognition is not supported on this device.", Toast.LENGTH_SHORT).show()
        }
    }
}`;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-stone-100 pb-4 mb-6">
        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
          <Terminal size={22} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Android Studio Integration Guide</h2>
          <p className="text-xs text-stone-500">How to integrate this AI Assistant & voice logic inside your Android App</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Step 1 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-medium text-stone-800 text-sm">
            <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 text-xs flex items-center justify-center font-bold">1</span>
            Your Server API Base URL
          </div>
          <p className="text-xs text-stone-600 pl-7 leading-relaxed">
            The Express backend running here acts as a secure proxy to the Gemini API. Your Android Studio app should send its chat requests directly to this URL:
          </p>
          <div className="pl-7">
            <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono text-stone-700">
              <span className="break-all">{currentOrigin}/api/chat</span>
              <button
                onClick={() => copyToClipboard(`${currentOrigin}/api/chat`, "api_url")}
                className="text-stone-400 hover:text-stone-700 transition"
                title="Copy URL"
              >
                {copiedSection === "api_url" ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-medium text-stone-800 text-sm">
            <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 text-xs flex items-center justify-center font-bold">2</span>
            Retrofit Setup (Kotlin)
          </div>
          <p className="text-xs text-stone-600 pl-7 leading-relaxed">
            Use Retrofit to make async HTTP POST requests containing the current user message, vehicle profile, and recent fuel history for AI context:
          </p>
          <div className="pl-7 relative">
            <pre className="bg-stone-950 text-stone-200 text-xs p-4 rounded-xl font-mono overflow-x-auto max-h-60 leading-relaxed scrollbar-thin">
              {retrofitCode}
            </pre>
            <button
              onClick={() => copyToClipboard(retrofitCode, "retrofit")}
              className="absolute top-3 right-3 p-1.5 bg-stone-800 hover:bg-stone-700 rounded-md text-stone-300 transition"
              title="Copy Code"
            >
              {copiedSection === "retrofit" ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Step 3 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-medium text-stone-800 text-sm">
            <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 text-xs flex items-center justify-center font-bold">3</span>
            Native Voice (TTS & STT) in Android
          </div>
          <p className="text-xs text-stone-600 pl-7 leading-relaxed">
            Android has powerful built-in engines for speech recognition and speech generation supporting English, Urdu, Hindi, and Arabic. Use this native boilerplate:
          </p>
          <div className="pl-7 relative">
            <pre className="bg-stone-950 text-stone-200 text-xs p-4 rounded-xl font-mono overflow-x-auto max-h-60 leading-relaxed scrollbar-thin">
              {voiceCode}
            </pre>
            <button
              onClick={() => copyToClipboard(voiceCode, "voice")}
              className="absolute top-3 right-3 p-1.5 bg-stone-800 hover:bg-stone-700 rounded-md text-stone-300 transition"
              title="Copy Code"
            >
              {copiedSection === "voice" ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Tips box */}
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex gap-3 text-xs text-emerald-800 pl-4 mt-2">
          <Cpu size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-emerald-900">Developer Note</div>
            <p className="leading-relaxed">
              When launching your Android Studio app, you can pass the fuel data tracked on the phone in the JSON body. This gives the Gemini model real context, so it will accurately talk about the user's mileage, cost per unit, and advise them on how to optimize their fuel consumption based on real records!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
