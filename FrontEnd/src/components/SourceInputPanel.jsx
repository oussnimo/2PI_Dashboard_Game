import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Link, X, Loader, CheckCircle, Youtube, Plus } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

/**
 * SourceInputPanel — Unified ChatGPT-style single input
 *
 * One textarea where the user:
 *   - Types a prompt directly
 *   - Pastes URLs (auto-detected, shown as chips below — up to 2)
 *   - Attaches a file via the "+" button (shown as a chip below)
 *
 * Props:
 *   - prompt            : string    – current text prompt value
 *   - onPromptChange    : fn(str)   – called when text prompt changes
 *   - onSourceReady     : fn(str)   – called with extracted text from file/URL
 *   - sourceText        : string    – currently extracted source text (controlled)
 *   - onClearSource     : fn()      – called when source text is cleared
 *   - onUrlChipsChange  : fn(urls)  – called when URL chip array changes (array of up to 2 strings)
 *   - onFileChange      : fn(file)  – called when file is attached/removed
 */
const MAX_URLS = 2;

function SourceInputPanel({ prompt, onPromptChange, onSourceReady, sourceText, onClearSource, onUrlChipsChange, onFileChange }) {

    // ── File state ──────────────────────────────────────────────────────────
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const fileInputRef = useRef(null);

    // ── URL chips state (array of up to MAX_URLS strings) ───────────────────
    const [urlChips, setUrlChips] = useState([]);   // ["https://...", "https://..."]
    const [isFetching, setIsFetching] = useState(false);
    const [urlSourceTypes, setUrlSourceTypes] = useState([]); // mirrors urlChips indexing

    // ── Drag state ───────────────────────────────────────────────────────────
    const [isDragOver, setIsDragOver] = useState(false);

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/";
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const authHeaders = { Authorization: `Bearer ${token}` };

    // ── URL auto-detection ───────────────────────────────────────────────────
    const URL_REGEX = /https?:\/\/[^\s]+/gi;
    const isYoutubeUrl = (u) => /(?:youtube\.com\/(?:watch|shorts|live|embed)|youtu\.be\/)/i.test(u);

    const handleTextareaChange = (e) => {
        const raw = e.target.value;
        const matches = raw.match(URL_REGEX);

        if (matches && matches.length > 0) {
            const detectedUrl = matches[0];
            // Only add if not already in chips and we haven't hit the limit
            if (!urlChips.includes(detectedUrl) && urlChips.length < MAX_URLS) {
                const withoutUrl = raw.replace(detectedUrl, "").replace(/^\s+|\s+$/g, "").replace(/\s{2,}/g, " ");
                onPromptChange(withoutUrl);
                const newChips = [...urlChips, detectedUrl];
                setUrlChips(newChips);
                setUrlSourceTypes((prev) => [...prev, null]);
                onClearSource();
                onUrlChipsChange?.(newChips);
            } else if (urlChips.includes(detectedUrl)) {
                // URL already added — just strip from textarea
                const withoutUrl = raw.replace(detectedUrl, "").replace(/^\s+|\s+$/g, "").replace(/\s{2,}/g, " ");
                onPromptChange(withoutUrl);
            } else {
                // Limit reached
                onPromptChange(raw);
                toast.error(`Maximum ${MAX_URLS} URLs allowed.`);
            }
        } else {
            onPromptChange(raw);
        }
    };

    const removeUrlChip = (index) => {
        const newChips = urlChips.filter((_, i) => i !== index);
        const newTypes = urlSourceTypes.filter((_, i) => i !== index);
        setUrlChips(newChips);
        setUrlSourceTypes(newTypes);
        if (newChips.length === 0) onClearSource();
        onUrlChipsChange?.(newChips);
    };

    // ── File upload ──────────────────────────────────────────────────────────
    const ACCEPTED_TYPES = [".pdf", ".txt", ".docx", ".doc"];
    const MAX_SIZE_MB = 5;

    const validateFile = (file) => {
        const ext = "." + file.name.split(".").pop().toLowerCase();
        if (!ACCEPTED_TYPES.includes(ext)) {
            toast.error("Unsupported file type. Please upload a PDF, TXT, or DOCX file.");
            return false;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            toast.error(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
            return false;
        }
        return true;
    };

    const handleFileSelect = (file) => {
        if (!validateFile(file)) return;
        setUploadedFile(file);
        onClearSource();
        onFileChange?.(file);
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleExtractFile = async () => {
        if (!uploadedFile) return;
        setIsExtracting(true);
        const formData = new FormData();
        formData.append("file", uploadedFile);
        try {
            const response = await axios.post(`${apiUrl}extract-file`, formData, {
                headers: { ...authHeaders, "Content-Type": "multipart/form-data" },
            });
            if (response.data.success) {
                onSourceReady(response.data.text);
                toast.success("Text extracted successfully!");
            } else {
                toast.error(response.data.message || "Failed to extract text from file.");
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message || "An error occurred";
            toast.error(msg);
        } finally {
            setIsExtracting(false);
        }
    };

    const removeFile = () => {
        setUploadedFile(null);
        onClearSource();
        onFileChange?.(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ── Drag and drop ────────────────────────────────────────────────────────
    const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
    const handleDragLeave = () => setIsDragOver(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    const hasChips = urlChips.length > 0 || !!uploadedFile;
    const canAddMoreUrls = urlChips.length < MAX_URLS;

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isDragOver
                ? "border-purple-main bg-purple-main/10 shadow-lg"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60"
                }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* ── Main textarea ── */}
            <div className="relative">
                <textarea
                    value={prompt}
                    onChange={handleTextareaChange}
                    placeholder={
                        hasChips
                            ? canAddMoreUrls
                                ? "Add a description, or paste a second URL…"
                                : "Add a description of what you want from these sources…"
                            : "Write your prompt, or paste a URL / drag a file here…"
                    }
                    className="w-full bg-transparent resize-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-4 pt-4 pb-2 min-h-[80px] outline-none"
                    rows={3}
                />
            </div>

            {/* ── Chips row ── */}
            <AnimatePresence>
                {hasChips && (
                    <motion.div
                        className="flex flex-wrap gap-2 px-4 pb-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        {/* File chip */}
                        {uploadedFile && (
                            <motion.div
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30 text-xs font-medium text-purple-700 dark:text-purple-300 max-w-[200px]"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                            >
                                <FileText size={12} className="flex-shrink-0" />
                                <span className="truncate">{uploadedFile.name}</span>
                                {isExtracting && <Loader size={11} className="animate-spin flex-shrink-0" />}
                                {sourceText && urlChips.length === 0 && <CheckCircle size={12} className="flex-shrink-0 text-green-500" />}
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    className="flex-shrink-0 ml-0.5 p-0.5 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full transition-colors"
                                >
                                    <X size={10} />
                                </button>
                            </motion.div>
                        )}

                        {/* URL chips — up to 2 */}
                        {urlChips.map((chip, index) => (
                            <motion.div
                                key={chip}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium max-w-[220px] ${isYoutubeUrl(chip)
                                    ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                    : "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    }`}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                            >
                                {isYoutubeUrl(chip) ? (
                                    <Youtube size={12} className="flex-shrink-0" />
                                ) : (
                                    <Link size={12} className="flex-shrink-0" />
                                )}
                                {/* Label: "URL 1" or "URL 2" prefix when there are 2 */}
                                {urlChips.length > 1 && (
                                    <span className="font-bold opacity-60 flex-shrink-0">#{index + 1}</span>
                                )}
                                <span className="truncate">
                                    {chip.replace(/^https?:\/\//, "").slice(0, 28)}
                                    {chip.length > 33 ? "…" : ""}
                                </span>
                                {isFetching && <Loader size={11} className="animate-spin flex-shrink-0" />}
                                {sourceText && (
                                    <CheckCircle size={12} className="flex-shrink-0 text-green-500" />
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeUrlChip(index)}
                                    className="flex-shrink-0 ml-0.5 p-0.5 hover:bg-current/20 rounded-full transition-colors opacity-60 hover:opacity-100"
                                >
                                    <X size={10} />
                                </button>
                            </motion.div>
                        ))}

                        {/* "Add URL" hint when 1 chip present and limit not reached */}
                        {urlChips.length === 1 && canAddMoreUrls && (
                            <motion.span
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-400 dark:text-gray-500"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <Plus size={10} />
                                Paste a 2nd URL above
                            </motion.span>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Extracted source text badge ── */}
            <AnimatePresence>
                {sourceText && (
                    <motion.div
                        className="mx-4 mb-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                    >
                        <div className="flex items-center gap-1">
                            <CheckCircle size={11} className="text-green-600 dark:text-green-400" />
                            <span className="text-xs font-medium text-green-700 dark:text-green-300">
                                {urlChips.length > 1
                                    ? `${urlChips.length} sources ready`
                                    : urlSourceTypes[0] === "youtube_transcript"
                                        ? "YouTube transcript ready"
                                        : urlSourceTypes[0] === "youtube_description"
                                            ? "YouTube info ready (no captions)"
                                            : urlSourceTypes[0] === "webpage"
                                                ? "Page content ready"
                                                : "File content ready"}
                                {" "}({sourceText.length} chars)
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                            {sourceText.substring(0, 100)}…
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Bottom toolbar ── */}
            <div className="flex items-center gap-3 px-3 pb-3 pt-1">
                {/* "+" file attach button */}
                <motion.button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach a file (PDF, TXT, DOCX)"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-main/10 border border-purple-main/30 text-purple-main dark:text-purple-light hover:bg-purple-main/20 hover:border-purple-main transition-all duration-200 text-xs font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Plus size={13} />
                    <span>Attach file</span>
                </motion.button>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    PDF, TXT, DOCX — or drag &amp; drop · up to {MAX_URLS} URLs
                </span>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.docx,.doc"
                className="hidden"
                onChange={handleFileInputChange}
            />
        </div>
    );
}

export default SourceInputPanel;
