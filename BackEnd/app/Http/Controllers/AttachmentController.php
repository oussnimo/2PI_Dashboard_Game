<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser as PdfParser;
use GuzzleHttp\Client;
use Exception;

class AttachmentController extends Controller
{
    /**
     * Process PDF upload and extract text + validate links
     * 
     * Expected input (multipart/form-data):
     * - pdf: Optional file (PDF, max 5MB)
     * - links: Array of URLs (optional)
     */
    public function process(Request $request)
    {
        \Log::info('📎 [Attachment] Processing attachments...');

        $request->validate([
            'pdf' => 'nullable|file|mimes:pdf|max:5120', // 5MB max
            'links' => 'nullable|array',
            'links.*' => 'nullable|string|url'
        ]);

        $extractedText = '';
        $attachmentId = null;
        $validatedLinks = [];
        $errors = [];

        try {
            // ===== STEP 1: Parse PDF if provided =====
            if ($request->hasFile('pdf')) {
                \Log::info('📄 [Attachment] Processing PDF file...');
                
                $file = $request->file('pdf');
                $fileName = $file->getClientOriginalName();
                
                // Store file in storage/app/pdfs/
                $storagePath = $file->store('pdfs');
                $attachmentId = $storagePath;
                
                \Log::info("✅ PDF stored at: {$storagePath}");

                // Extract text using PdfParser
                try {
                    $parser = new PdfParser();
                    $fullPath = storage_path("app/{$storagePath}");
                    $pdf = $parser->parseFile($fullPath);
                    $extractedText = $pdf->getText();
                    
                    // Clean up excessive whitespace
                    $extractedText = preg_replace('/\s+/', ' ', trim($extractedText));
                    
                    \Log::info("✅ PDF text extracted. Length: " . strlen($extractedText) . " chars");
                } catch (Exception $e) {
                    \Log::error("❌ PDF parsing error: " . $e->getMessage());
                    $errors[] = "Erreur lors de la lecture du PDF: " . $e->getMessage();
                }
            }

            // ===== STEP 2: Validate provided links =====
            if ($request->has('links') && is_array($request->input('links'))) {
                \Log::info('🔗 [Attachment] Validating provided links...');
                
                foreach ($request->input('links') as $link) {
                    if (!empty($link)) {
                        // Basic URL validation
                        if (filter_var($link, FILTER_VALIDATE_URL)) {
                            $validatedLinks[] = $link;
                            \Log::info("✅ Link valid: {$link}");
                        } else {
                            \Log::warning("⚠️ Invalid URL: {$link}");
                            $errors[] = "URL invalide: {$link}";
                        }
                    }
                }
            }

            // ===== STEP 3: Extract URLs from extracted PDF text (optional) =====
            if (!empty($extractedText)) {
                \Log::info('🔍 [Attachment] Extracting URLs from PDF text...');
                preg_match_all('/https?:\/\/[^\s"\'<>]+/i', $extractedText, $matches);
                if (!empty($matches[0])) {
                    $extractedFromText = array_values(array_unique($matches[0]));
                    $validatedLinks = array_values(array_unique(array_merge($validatedLinks, $extractedFromText)));
                    \Log::info("✅ Found " . count($extractedFromText) . " URLs in PDF text");
                }
            }

            // ===== STEP 4: Prepare response =====
            $preview = mb_strimwidth($extractedText, 0, 3000, '...');
            
            \Log::info('✅ [Attachment] Processing complete');

            return response()->json([
                'success' => true,
                'data' => [
                    'attachment_id' => $attachmentId,
                    'pdf_text' => $extractedText,
                    'preview' => $preview,
                    'links' => $validatedLinks,
                    'text_length' => strlen($extractedText),
                    'links_count' => count($validatedLinks),
                ],
                'errors' => $errors,
                'message' => 'Attachments processed successfully'
            ], 200);

        } catch (Exception $e) {
            \Log::error('❌ [Attachment] Processing error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du traitement des attachments: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retrieve attachment content by ID (optional, for verification)
     */
    public function retrieve(Request $request)
    {
        $request->validate([
            'attachment_id' => 'required|string'
        ]);

        $attachmentId = $request->input('attachment_id');

        if (!Storage::exists($attachmentId)) {
            return response()->json([
                'success' => false,
                'message' => 'Attachment not found'
            ], 404);
        }

        try {
            $fullPath = storage_path("app/{$attachmentId}");
            $parser = new PdfParser();
            $pdf = $parser->parseFile($fullPath);
            $text = $pdf->getText();

            return response()->json([
                'success' => true,
                'data' => [
                    'attachment_id' => $attachmentId,
                    'text' => $text
                ]
            ], 200);
        } catch (Exception $e) {
            \Log::error('❌ [Attachment] Retrieve error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving attachment: ' . $e->getMessage()
            ], 500);
        }
    }
}
