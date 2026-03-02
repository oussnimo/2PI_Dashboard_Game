<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use ZipArchive;

class ExportController extends Controller
{
    public function exportQuizAsZip(Request $request)
    {
        try {
            \Log::info('📦 [Export] Starting SCORM export');

            $validated = $request->validate([
                'course' => 'required|string',
                'topic' => 'required|string',
                'gameNumber' => 'required|integer',
                'numLevels' => 'required|integer',
                'levels' => 'required|array',
            ]);

            $quizData = $validated;
            $scormTitle = "{$quizData['course']} - {$quizData['topic']}";
            $timestamp = now()->format('Y-m-d_H-i-s');
            $zipFilename = "scorm_quiz_{$timestamp}.zip";
            $zipPath = storage_path("app/temp/{$zipFilename}");

            if (!file_exists(storage_path('app/temp'))) {
                mkdir(storage_path('app/temp'), 0755, true);
            }

            $zip = new ZipArchive();
            if ($zip->open($zipPath, ZipArchive::CREATE) !== TRUE) {
                return response()->json(['success' => false, 'message' => 'Cannot create ZIP'], 500);
            }

            // Add imsmanifest.xml
            $zip->addFromString('imsmanifest.xml', $this->getManifest($scormTitle));
            \Log::info('✅ manifest added');

            // Add index.html
            $zip->addFromString('index.html', $this->getIndexHtml($scormTitle));
            \Log::info('✅ index.html added');

            // Add CSS
            $zip->addFromString('css/style.css', $this->getCss());
            \Log::info('✅ css added');

            // Add JavaScript
            $zip->addFromString('js/app.js', $this->getJs());
            \Log::info('✅ js added');

            // Add questions.json
            $zip->addFromString('content/questions.json', json_encode([
                'title' => $scormTitle,
                'levels' => $quizData['levels']
            ], JSON_UNESCAPED_UNICODE));
            \Log::info('✅ questions added');

            // Add README
            $zip->addFromString('README.txt', "SCORM Quiz\n\nTitle: {$scormTitle}\nLevels: {$quizData['numLevels']}\n");
            \Log::info('✅ readme added');

            $zip->close();
            \Log::info("✅ [Export] SCORM package ready: {$zipFilename}");

            return response()->download($zipPath, $zipFilename)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            \Log::error('Export error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    private function getManifest($title)
    {
        $id = "quiz_" . md5($title);
        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="{$id}" version="1.0" xmlns="http://www.imsproject.org/xsd/imscp_v1p1">
    <metadata>
        <schema>ADL SCORM</schema>
        <schemaversion>1.2</schemaversion>
    </metadata>
    <organizations default="org1">
        <organization identifier="org1">
            <title>{$title}</title>
            <item identifier="item1" identifierref="res1">
                <title>{$title}</title>
            </item>
        </organization>
    </organizations>
    <resources>
        <resource identifier="res1" type="webcontent">
            <file href="index.html"/>
        </resource>
    </resources>
</manifest>
XML;
    }

    private function getIndexHtml($title)
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$title}</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <h1>{$title}</h1>
        <div id="quiz">Loading quiz...</div>
    </div>
    <script src="js/app.js"></script>
</body>
</html>
HTML;
    }

    private function getCss()
    {
        return <<<CSS
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
.container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
h1 { color: #333; margin-bottom: 20px; }
#quiz { margin: 20px 0; }
.question { margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #667eea; border-radius: 4px; }
.answers { margin-top: 10px; display: flex; flex-direction: column; gap: 10px; }
button { padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
button:hover { background: #5568d3; }
input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
CSS;
    }

    private function getJs()
    {
        return <<<JS
let quizData = null;
let currentLevel = 0;

async function initQuiz() {
    try {
        const resp = await fetch('content/questions.json');
        quizData = await resp.json();
        renderQuiz();
    } catch(e) {
        document.getElementById('quiz').innerHTML = '<p>Error loading quiz: ' + e.message + '</p>';
    }
}

function renderQuiz() {
    if (!quizData || !quizData.levels) return;
    document.getElementById('quiz').innerHTML = '<p>Quiz loaded with ' + quizData.levels.length + ' levels</p>';
}

document.addEventListener('DOMContentLoaded', initQuiz);
JS;
    }
}
