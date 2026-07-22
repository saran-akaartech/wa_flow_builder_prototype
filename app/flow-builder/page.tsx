'use client'

import { useState, useMemo, useRef } from "react";

function Glyph({ ch, size, className }: { ch: string; size: number; className?: string }) {
    return (
        <span
            className={`inline-flex items-center justify-center leading-none ${className ?? ""}`}
            style={{ width: size, height: size, fontSize: Math.round(size * 0.9) }}
        >
            {ch}
        </span>
    );
}


/* ---------- brand ---------- */
const WA_GREEN = "#25D366";
const WA_TEAL = "#075E54";
const WA_HEADER = "#128C7E";

const FLOW_VERSION = "7.3";
const DATA_API_VERSION = "3.0";

/* ---------- component model ---------- */
const DATA_TYPES = new Set([
    "TextInput", "TextArea", "DatePicker", "Dropdown",
    "RadioButtonsGroup", "CheckboxGroup", "OptIn",
]);
const FORM_TYPES = new Set([...DATA_TYPES, "Footer"]);

const LIMITS: Record<string, number> = { TextHeading: 80, TextSubheading: 80, TextBody: 4096, TextCaption: 409 };

const META = {
    TextHeading: { label: "Heading", cat: "Text" },
    TextSubheading: { label: "Subheading", cat: "Text" },
    TextBody: { label: "Body", cat: "Text" },
    TextCaption: { label: "Caption", cat: "Text" },
    Image: { label: "Image", cat: "Media" },
    TextInput: { label: "Text input", cat: "Inputs" },
    TextArea: { label: "Text area", cat: "Inputs" },
    DatePicker: { label: "Date picker", cat: "Inputs" },
    Dropdown: { label: "Dropdown", cat: "Choices" },
    RadioButtonsGroup: { label: "Radio group", cat: "Choices" },
    CheckboxGroup: { label: "Checkbox group", cat: "Choices" },
    OptIn: { label: "Opt-in", cat: "Consent" },
    Footer: { label: "Footer button", cat: "Action" },
};

const PALETTE: { group: string; icon: string; items: ComponentType[] }[] = [
    { group: "Text", icon: "T", items: ["TextHeading", "TextSubheading", "TextBody", "TextCaption"] },
    { group: "Media", icon: "▧", items: ["Image"] },
    { group: "Inputs", icon: "I", items: ["TextInput", "TextArea", "DatePicker"] },
    { group: "Choices", icon: "☰", items: ["Dropdown", "RadioButtonsGroup", "CheckboxGroup"] },
    { group: "Consent", icon: "☑", items: ["OptIn"] },
    { group: "Action", icon: "➤", items: ["Footer"] },
];

const uid = () => Math.random().toString(36).slice(2, 9);

/* ---------- image constraints ---------- */
const MAX_IMAGE_BYTES = 100 * 1024; // 100 KB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"]; // jpg & jpeg both report image/jpeg

function validateImageFile(file: File): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "Image must be a JPEG, JPG or PNG file.";
    if (file.size > MAX_IMAGE_BYTES) return "Image must be 100 KB or smaller.";
    return null;
}

// Decoded byte size of a base64 string (ignores any leading data: URI prefix).
function base64Bytes(b64: string): number {
    const s = (b64.split(",").pop() || "").trim();
    if (!s) return 0;
    const padding = s.endsWith("==") ? 2 : s.endsWith("=") ? 1 : 0;
    return Math.floor(s.length * 3 / 4) - padding;
}

/* ---------- types ---------- */
type ComponentType = keyof typeof META;
type Option = { id: string; title: string; description?: string; image?: string; _mime?: string };

interface ComponentProps {
    text?: string;
    label?: string;
    name?: string;
    inputType?: string;
    required?: boolean;
    helperText?: string;
    options?: Option[];
    src?: string;
    altText?: string;
    width?: number;
    height?: number;
    scaleType?: string;
    nextScreen?: string | null;
    _mime?: string;
}

interface FlowComponent {
    uid: string;
    type: ComponentType;
    props: ComponentProps;
}

interface Screen {
    uid: string;
    id: string;
    title: string;
    terminal: boolean;
    children: FlowComponent[];
}

interface Flow {
    version: string;
    dataApiVersion: string;
    screens: Screen[];
}

type Issue = { level: "error" | "warn"; msg: string };

function defaults(type: ComponentType): ComponentProps {
    switch (type) {
        case "TextHeading": return { text: "Heading" };
        case "TextSubheading": return { text: "Subheading" };
        case "TextBody": return { text: "Body text goes here." };
        case "TextCaption": return { text: "Caption" };
        case "TextInput": return { label: "Your name", name: "name", inputType: "text", required: true, helperText: "" };
        case "TextArea": return { label: "Message", name: "message", required: false, helperText: "" };
        case "DatePicker": return { label: "Pick a date", name: "date", required: false };
        case "Dropdown": return { label: "Choose one", name: "choice", required: true, options: [{ id: uid(), title: "Option 1" }, { id: uid(), title: "Option 2" }] };
        case "RadioButtonsGroup": return { label: "Select one", name: "radio_choice", required: true, options: [{ id: uid(), title: "Option 1" }, { id: uid(), title: "Option 2" }] };
        case "CheckboxGroup": return { label: "Select any", name: "checks", required: false, options: [{ id: uid(), title: "Option 1" }, { id: uid(), title: "Option 2" }] };
        case "OptIn": return { label: "I agree to the terms and privacy policy", name: "opt_in", required: true };
        case "Image": return { src: "", altText: "Image", width: 300, height: 200, scaleType: "contain" };
        case "Footer": return { label: "Continue", nextScreen: null };
        default: return {};
    }
}

/* ---------- initial flow ---------- */
const initialFlow: Flow = {
    version: FLOW_VERSION,
    dataApiVersion: DATA_API_VERSION,
    screens: [
        {
            uid: uid(), id: "WELCOME", title: "Welcome", terminal: false,
            children: [
                { uid: uid(), type: "TextHeading", props: { text: "Hi there 👋" } },
                { uid: uid(), type: "TextBody", props: { text: "Tell us a little about you and we'll get you sorted." } },
                { uid: uid(), type: "TextInput", props: { label: "Your name", name: "name", inputType: "text", required: true, helperText: "" } },
                { uid: uid(), type: "Dropdown", props: { label: "What do you need?", name: "topic", required: true, options: [{ id: uid(), title: "Sales" }, { id: uid(), title: "Support" }] } },
                { uid: uid(), type: "Footer", props: { label: "Continue", nextScreen: "SUMMARY" } },
            ],
        },
        {
            uid: uid(), id: "SUMMARY", title: "All done", terminal: true,
            children: [
                { uid: uid(), type: "TextHeading", props: { text: "Thanks!" } },
                { uid: uid(), type: "TextBody", props: { text: "We've received your details and will be in touch shortly." } },
                { uid: uid(), type: "Footer", props: { label: "Done", nextScreen: null } },
            ],
        },
    ],
};

/* ---------- JSON generation ---------- */
function richDataSourceItem(o: Option): Record<string, unknown> {
    const item: Record<string, unknown> = { id: o.id, title: o.title };
    if (o.description) item.description = o.description;
    if (o.image) item.image = o.image;
    return item;
}

type FieldDescriptor = { name: string; jsonType: "string" | "array"; example: unknown };

function ownFields(screen: Screen): FieldDescriptor[] {
    const out: FieldDescriptor[] = [];
    screen.children.forEach((c) => {
        if (!DATA_TYPES.has(c.type) || !c.props.name) return;
        const p = c.props;
        switch (c.type) {
            case "CheckboxGroup":
                out.push({ name: p.name!, jsonType: "array", example: (p.options ?? []).slice(0, 2).map((o) => o.title) });
                break;
            case "Dropdown":
            case "RadioButtonsGroup":
                out.push({ name: p.name!, jsonType: "string", example: p.options?.[0]?.title ?? "Option 1" });
                break;
            case "DatePicker":
                out.push({ name: p.name!, jsonType: "string", example: String(Date.now()) });
                break;
            case "OptIn":
                out.push({ name: p.name!, jsonType: "string", example: "true" });
                break;
            default:
                out.push({ name: p.name!, jsonType: "string", example: p.label || "sample text" });
        }
    });
    return out;
}

function renderComponent(c: FlowComponent, screen: Screen, screens: Screen[], inherited: FieldDescriptor[]): Record<string, unknown> {
    const p = c.props;
    switch (c.type) {
        case "TextHeading": return { type: "TextHeading", text: p.text };
        case "TextSubheading": return { type: "TextSubheading", text: p.text };
        case "TextBody": return { type: "TextBody", text: p.text };
        case "TextCaption": return { type: "TextCaption", text: p.text };
        case "TextInput": {
            const o: Record<string, unknown> = { type: "TextInput", label: p.label, name: p.name, "input-type": p.inputType || "text", required: !!p.required };
            if (p.helperText) o["helper-text"] = p.helperText;
            return o;
        }
        case "TextArea": {
            const o: Record<string, unknown> = { type: "TextArea", label: p.label, name: p.name, required: !!p.required };
            if (p.helperText) o["helper-text"] = p.helperText;
            return o;
        }
        case "DatePicker":
            return { type: "DatePicker", label: p.label, name: p.name, required: !!p.required };
        case "Dropdown":
            return { type: "Dropdown", label: p.label, name: p.name, required: !!p.required, "data-source": (p.options ?? []).map((o) => ({ id: o.id, title: o.title })) };
        case "RadioButtonsGroup":
            return { type: "RadioButtonsGroup", label: p.label, name: p.name, required: !!p.required, "data-source": (p.options ?? []).map(richDataSourceItem) };
        case "CheckboxGroup":
            return { type: "CheckboxGroup", label: p.label, name: p.name, required: !!p.required, "data-source": (p.options ?? []).map(richDataSourceItem) };
        case "OptIn":
            return { type: "OptIn", label: p.label, name: p.name, required: !!p.required };
        case "Image":
            return { type: "Image", src: p.src, "alt-text": p.altText, width: Number(p.width) || 0, height: Number(p.height) || 0, "scale-type": p.scaleType };
        case "Footer": {
            const payload: Record<string, string> = {};
            screen.children.forEach((ch) => {
                if (DATA_TYPES.has(ch.type) && ch.props.name) payload[ch.props.name] = "${form." + ch.props.name + "}";
            });
            inherited.forEach((f) => { payload[f.name] = "${data." + f.name + "}"; });
            let action;
            if (screen.terminal) {
                action = { name: "data_exchange", payload };
            } else {
                const idx = screens.findIndex((s) => s.uid === screen.uid);
                const fallback = screens[idx + 1]?.id || null;
                const next = p.nextScreen || fallback;
                action = { name: "navigate", next: { type: "screen", name: next }, payload };
            }
            return { type: "Footer", label: p.label, "on-click-action": action };
        }
        default: return { type: c.type };
    }
}

function buildFlowJSON(flow: Flow): Record<string, unknown> {
    const out: Record<string, unknown> = { version: flow.version };
    if (flow.dataApiVersion) out.data_api_version = flow.dataApiVersion;

    const accumulated: FieldDescriptor[][] = [];
    const seen: Record<string, FieldDescriptor> = {};
    flow.screens.forEach((screen, i) => {
        accumulated[i] = Object.values(seen);
        ownFields(screen).forEach((f) => { seen[f.name] = f; });
    });

    out.routing_model = Object.fromEntries(flow.screens.map((screen, i) => {
        if (screen.terminal) return [screen.id, []];
        const footer = screen.children.find((c) => c.type === "Footer");
        const next = footer?.props.nextScreen || flow.screens[i + 1]?.id;
        return [screen.id, next ? [next] : []];
    }));

    out.screens = flow.screens.map((screen, i) => {
        const ordered = [...screen.children.filter((c) => c.type !== "Footer"), ...screen.children.filter((c) => c.type === "Footer")];
        const rendered = ordered.map((c) => renderComponent(c, screen, flow.screens, accumulated[i]));
        const needsForm = ordered.some((c) => FORM_TYPES.has(c.type));
        let children;
        if (needsForm) {
            const formName = (screen.id || "screen").toLowerCase() + "_form";
            children = [{ type: "Form", name: formName, children: rendered }];
        } else {
            children = rendered;
        }
        const s: Record<string, unknown> = { id: screen.id, title: screen.title };
        if (screen.terminal) s.terminal = true;
        if (accumulated[i].length) {
            s.data = Object.fromEntries(accumulated[i].map((f) => [
                f.name,
                f.jsonType === "array" ? { type: "array", items: { type: "string" }, __example__: f.example } : { type: "string", __example__: f.example },
            ]));
        }
        s.layout = { type: "SingleColumnLayout", children };
        return s;
    });
    return out;
}

/* ---------- validation ---------- */
const SNAKE = /^[a-z][a-z0-9_]*$/;
const SCREEN_ID = /^[A-Z][A-Z0-9_]*$/;

function validateFlow(flow: Flow): Issue[] {
    const issues: Issue[] = [];
    const err = (msg: string) => issues.push({ level: "error", msg });
    const warn = (msg: string) => issues.push({ level: "warn", msg });

    if (flow.screens.length === 0) err("Add at least one screen.");
    if (flow.screens.length && !flow.screens.some((s) => s.terminal)) warn("No terminal screen — mark the final screen as terminal so the flow can complete.");

    const ids = new Set();
    flow.screens.forEach((s) => {
        const where = s.id || "(unnamed screen)";
        if (!s.id) err("A screen is missing an ID.");
        else if (!SCREEN_ID.test(s.id)) err(`Screen ID "${s.id}" must be UPPER_SNAKE_CASE.`);
        if (s.id && ids.has(s.id)) err(`Duplicate screen ID "${s.id}".`);
        if (s.id) ids.add(s.id);
        if (!s.title?.trim()) warn(`${where}: screen title is empty.`);
        else if (s.title.length > 30) warn(`${where}: title over 30 characters.`);

        const names = new Set();
        let footers = 0;
        s.children.forEach((c) => {
            const p = c.props;
            if (["TextHeading", "TextSubheading", "TextBody", "TextCaption"].includes(c.type)) {
                if (!p.text?.trim()) warn(`${where}: ${META[c.type].label} has no text.`);
                else if (p.text.length > LIMITS[c.type]) warn(`${where}: ${META[c.type].label} exceeds ${LIMITS[c.type]} chars.`);
            }
            if (DATA_TYPES.has(c.type)) {
                if (!p.label?.trim()) err(`${where}: ${META[c.type].label} needs a label.`);
                if (!p.name?.trim()) err(`${where}: ${META[c.type].label} needs a name.`);
                else if (!SNAKE.test(p.name)) err(`${where}: name "${p.name}" must be snake_case.`);
                else if (names.has(p.name)) err(`${where}: duplicate field name "${p.name}".`);
                if (p.name) names.add(p.name);
            }
            if (["Dropdown", "RadioButtonsGroup", "CheckboxGroup"].includes(c.type)) {
                if (!p.options?.length) err(`${where}: ${META[c.type].label} needs at least one option.`);
                p.options?.forEach((o) => {
                    if (!o.title?.trim()) warn(`${where}: an option title is empty.`);
                    const img = (o.image || "").trim();
                    if (img && !img.startsWith("http") && base64Bytes(img) > MAX_IMAGE_BYTES) warn(`${where}: option "${o.title || "?"}" image exceeds 100 KB.`);
                });
            }
            if (c.type === "Image") {
                if (!p.src?.trim()) warn(`${where}: image has no source (upload or paste base64/URL).`);
                else {
                    const src = p.src.trim();
                    if (!src.startsWith("http") && base64Bytes(src) > MAX_IMAGE_BYTES) warn(`${where}: image exceeds 100 KB.`);
                }
                if (!(Number(p.width) > 0) || !(Number(p.height) > 0)) warn(`${where}: image width and height should be positive numbers.`);
                if (!["cover", "contain"].includes(p.scaleType ?? "")) warn(`${where}: scale-type should be "cover" or "contain".`);
            }
            if (c.type === "Footer") {
                footers++;
                if (!p.label?.trim()) err(`${where}: footer button needs a label.`);
                if (!s.terminal) {
                    const idx = flow.screens.findIndex((x) => x.uid === s.uid);
                    const next = p.nextScreen || flow.screens[idx + 1]?.id;
                    if (!next) err(`${where}: footer has no next screen to navigate to.`);
                    else if (!flow.screens.some((x) => x.id === next)) err(`${where}: footer points to missing screen "${next}".`);
                }
            }
        });
        if (footers === 0) warn(`${where}: no footer button — users can't move forward.`);
        if (footers > 1) err(`${where}: more than one footer button.`);
    });
    return issues;
}

/* ---------- preview renderers ---------- */
function imgSrc(p: ComponentProps) {
    const s = (p.src || "").trim();
    if (!s) return "";
    if (s.startsWith("http") || s.startsWith("data:")) return s;
    return `data:${p._mime || "image/png"};base64,${s}`;
}

function PvLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <div className="mb-1 text-[13px] font-medium text-gray-800">
            {children}{required && <span className="text-red-500"> *</span>}
        </div>
    );
}

function optionImg(o: Option) {
    const s = (o.image || "").trim();
    if (!s) return "";
    if (s.startsWith("http") || s.startsWith("data:")) return s;
    return `data:${o._mime || "image/png"};base64,${s}`;
}

function PvChoiceOption({ o, selector }: { o: Option; selector: React.ReactNode }) {
    const src = optionImg(o);
    return (
        <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-2.5 py-2">
            {src && <img src={src} alt={o.title} className="h-10 w-10 shrink-0 rounded object-cover" />}
            <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-gray-900">{o.title || "Option"}</div>
                {o.description ? <div className="text-[11px] leading-snug text-gray-500 whitespace-pre-wrap">{o.description}</div> : null}
            </div>
            <span className="shrink-0">{selector}</span>
        </div>
    );
}

function PreviewComponent({ c }: { c: FlowComponent }) {
    const p = c.props;
    switch (c.type) {
        case "TextHeading": return <div className="text-[19px] font-bold leading-tight text-gray-900">{p.text || " "}</div>;
        case "TextSubheading": return <div className="text-[15px] font-semibold text-gray-800">{p.text || " "}</div>;
        case "TextBody": return <div className="text-[14px] leading-snug text-gray-700 whitespace-pre-wrap">{p.text || " "}</div>;
        case "TextCaption": return <div className="text-[12px] text-gray-500">{p.text || " "}</div>;
        case "TextInput":
            return (
                <div>
                    <PvLabel required={p.required}>{p.label}</PvLabel>
                    <div className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-gray-400">
                        {p.inputType === "email" ? "name@email.com" : p.inputType === "number" ? "0" : p.inputType === "phone" ? "+1 555…" : "Type here"}
                    </div>
                    {p.helperText ? <div className="mt-1 text-[11px] text-gray-400">{p.helperText}</div> : null}
                </div>
            );
        case "TextArea":
            return (
                <div>
                    <PvLabel required={p.required}>{p.label}</PvLabel>
                    <div className="h-16 rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-gray-400">Type here</div>
                </div>
            );
        case "DatePicker":
            return (
                <div>
                    <PvLabel required={p.required}>{p.label}</PvLabel>
                    <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-gray-400">
                        <span>Select date</span><Glyph ch="📅" size={15} />
                    </div>
                </div>
            );
        case "Dropdown":
            return (
                <div>
                    <PvLabel required={p.required}>{p.label}</PvLabel>
                    <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-gray-400">
                        <span>{p.options?.[0]?.title || "Select"}</span><Glyph ch="▼" size={15} />
                    </div>
                </div>
            );
        case "RadioButtonsGroup":
            return (
                <div>
                    <PvLabel required={p.required}>{p.label}</PvLabel>
                    <div className="space-y-1.5">
                        {p.options?.map((o, i) => (
                            <PvChoiceOption key={o.id} o={o}
                                selector={<span className="inline-block h-4 w-4 rounded-full border-2" style={{ borderColor: i === 0 ? WA_GREEN : "#cbd5e1" }} />} />
                        ))}
                    </div>
                </div>
            );
        case "CheckboxGroup":
            return (
                <div>
                    <PvLabel required={p.required}>{p.label}</PvLabel>
                    <div className="space-y-1.5">
                        {p.options?.map((o) => (
                            <PvChoiceOption key={o.id} o={o}
                                selector={<span className="inline-block h-4 w-4 rounded border-2 border-gray-300" />} />
                        ))}
                    </div>
                </div>
            );
        case "OptIn":
            return (
                <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded border-2 border-gray-300" />
                    <span className="text-[12px] leading-snug text-gray-700">{p.label}</span>
                </div>
            );
        case "Image": {
            const src = imgSrc(p);
            const declW = Number(p.width) || 300;
            const declH = Number(p.height) || 200;
            const boxW = Math.min(declW, 248);
            const boxH = declW > 0 ? Math.round(declH * (boxW / declW)) : declH;
            if (src) {
                return <img src={src} alt={p.altText} style={{ width: boxW, height: boxH, objectFit: p.scaleType === "cover" ? "cover" : "contain", borderRadius: 8, display: "block" }} />;
            }
            return (
                <div style={{ width: boxW, height: boxH }} className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400">
                    <Glyph ch="▧" size={20} />
                    <span className="text-[11px]">{declW}×{declH} · {p.scaleType}</span>
                </div>
            );
        }
        default: return null;
    }
}

/* ---------- small UI helpers ---------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
            {children}
        </label>
    );
}
const inputCls = "w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] text-gray-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button onClick={() => onChange(!checked)} className="flex items-center gap-2 text-[13px] text-gray-700">
            <span className="relative inline-block h-5 w-9 rounded-full transition-colors" style={{ backgroundColor: checked ? WA_GREEN : "#cbd5e1" }}>
                <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: checked ? "18px" : "2px" }} />
            </span>
            {label}
        </button>
    );
}

/* ---------- property editors ---------- */
function OptionsEditor({ options, onChange, rich }: { options: Option[]; onChange: (options: Option[]) => void; rich?: boolean }) {
    const [uploadError, setUploadError] = useState<{ id: string; msg: string } | null>(null);
    const patch = (id: string, upd: Partial<Option>) => onChange(options.map((x) => x.id === id ? { ...x, ...upd } : x));
    const remove = (id: string) => onChange(options.filter((x) => x.id !== id));
    const uploadImage = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const error = validateImageFile(file);
        if (error) { setUploadError({ id, msg: error }); return; }
        setUploadError(null);
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result);
            const m = result.match(/^data:(.*?);base64,(.*)$/);
            if (m) patch(id, { image: m[2], _mime: m[1] });
            else patch(id, { image: result, _mime: undefined });
        };
        reader.readAsDataURL(file);
    };

    if (!rich) {
        return (
            <div className="space-y-1.5">
                {options.map((o) => (
                    <div key={o.id} className="flex items-center gap-1.5">
                        <input className={inputCls} value={o.title} onChange={(e) => patch(o.id, { title: e.target.value })} />
                        <button className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500" onClick={() => remove(o.id)} aria-label="Remove option"><Glyph ch="×" size={14} /></button>
                    </div>
                ))}
                <button className="flex items-center gap-1 text-[12px] font-medium text-emerald-600 hover:text-emerald-700" onClick={() => onChange([...options, { id: uid(), title: `Option ${options.length + 1}` }])}>
                    <Glyph ch="+" size={13} /> Add option
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {options.map((o) => {
                const src = optionImg(o);
                return (
                    <div key={o.id} className="space-y-1.5 rounded-md border border-gray-200 p-2">
                        <div className="flex items-start gap-2">
                            <label className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded border border-dashed border-gray-300 text-gray-400 hover:border-emerald-400 hover:bg-emerald-50">
                                {src
                                    ? <img src={src} alt={o.title} className="h-full w-full object-cover" />
                                    : <Glyph ch="⬆" size={14} />}
                                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => uploadImage(o.id, e)} />
                            </label>
                            <div className="min-w-0 flex-1 space-y-1.5">
                                <input className={inputCls} placeholder="Title" value={o.title} onChange={(e) => patch(o.id, { title: e.target.value })} />
                                <textarea rows={2} className={inputCls} placeholder="Description (optional)" value={o.description ?? ""} onChange={(e) => patch(o.id, { description: e.target.value })} />
                            </div>
                            <button className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500" onClick={() => remove(o.id)} aria-label="Remove option"><Glyph ch="×" size={14} /></button>
                        </div>
                        {uploadError?.id === o.id ? <div className="text-[11px] text-red-500">{uploadError.msg}</div> : null}
                        {o.image ? (
                            <button className="text-[11px] font-medium text-gray-400 hover:text-red-500" onClick={() => patch(o.id, { image: undefined, _mime: undefined })}>Remove image</button>
                        ) : null}
                    </div>
                );
            })}
            <button className="flex items-center gap-1 text-[12px] font-medium text-emerald-600 hover:text-emerald-700" onClick={() => onChange([...options, { id: uid(), title: `Option ${options.length + 1}` }])}>
                <Glyph ch="+" size={13} /> Add option
            </button>
        </div>
    );
}

function PropertyEditor({ comp, screen, screens, onProps }: { comp: FlowComponent | null; screen: Screen; screens: Screen[]; onProps: (props: ComponentProps) => void }) {
    if (!comp) return <div className="p-4 text-[13px] text-gray-400">Select a component in the preview to edit it.</div>;
    const p = comp.props;
    const set = (patch: Partial<ComponentProps>) => onProps({ ...p, ...patch });
    const isText = ["TextHeading", "TextSubheading", "TextBody", "TextCaption"].includes(comp.type);
    const isChoice = ["Dropdown", "RadioButtonsGroup", "CheckboxGroup"].includes(comp.type);
    const [imgError, setImgError] = useState<string | null>(null);
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const error = validateImageFile(file);
        if (error) { setImgError(error); return; }
        setImgError(null);
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result);
            const m = result.match(/^data:(.*?);base64,(.*)$/);
            if (m) set({ src: m[2], _mime: m[1] });
            else set({ src: result, _mime: undefined });
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-3 p-3">
            <div className="text-[13px] font-semibold text-gray-800">{META[comp.type].label}</div>

            {isText && (
                <Field label="Text">
                    <textarea rows={comp.type === "TextBody" ? 4 : 2} className={inputCls} value={p.text} onChange={(e) => set({ text: e.target.value })} />
                </Field>
            )}

            {comp.type === "Image" && (
                <>
                    <Field label="Image source (base64 or URL)">
                        <div className="space-y-1.5">
                            <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 px-2 py-2 text-[12px] text-gray-600 hover:border-emerald-400 hover:bg-emerald-50">
                                <Glyph ch="⬆" size={13} /> Upload image
                                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleUpload} />
                            </label>
                            {imgError && <div className="text-[11px] text-red-500">{imgError}</div>}
                            <textarea rows={2} placeholder="Paste base64 or an image URL" className={`${inputCls} font-mono text-[11px]`} value={p.src} onChange={(e) => set({ src: e.target.value, _mime: undefined })} />
                        </div>
                    </Field>
                    <Field label="Alt text"><input className={inputCls} value={p.altText} onChange={(e) => set({ altText: e.target.value })} /></Field>
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Width"><input type="number" className={inputCls} value={p.width} onChange={(e) => set({ width: Number(e.target.value) || 0 })} /></Field>
                        <Field label="Height"><input type="number" className={inputCls} value={p.height} onChange={(e) => set({ height: Number(e.target.value) || 0 })} /></Field>
                    </div>
                    <Field label="Scale type">
                        <select className={inputCls} value={p.scaleType} onChange={(e) => set({ scaleType: e.target.value })}>
                            <option value="contain">contain</option>
                            <option value="cover">cover</option>
                        </select>
                    </Field>
                </>
            )}

            {(DATA_TYPES.has(comp.type)) && (
                <>
                    <Field label="Label"><input className={inputCls} value={p.label} onChange={(e) => set({ label: e.target.value })} /></Field>
                    <Field label="Name (data key)"><input className={inputCls} value={p.name} onChange={(e) => set({ name: e.target.value })} /></Field>
                </>
            )}

            {comp.type === "TextInput" && (
                <Field label="Input type">
                    <select className={inputCls} value={p.inputType} onChange={(e) => set({ inputType: e.target.value })}>
                        {["text", "number", "email", "password", "passcode", "phone"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </Field>
            )}

            {(comp.type === "TextInput" || comp.type === "TextArea") && (
                <Field label="Helper text"><input className={inputCls} value={p.helperText} onChange={(e) => set({ helperText: e.target.value })} /></Field>
            )}

            {isChoice && <Field label="Options"><OptionsEditor options={p.options ?? []} rich={comp.type === "RadioButtonsGroup" || comp.type === "CheckboxGroup"} onChange={(options) => set({ options })} /></Field>}

            {DATA_TYPES.has(comp.type) && (
                <Toggle checked={!!p.required} onChange={(v) => set({ required: v })} label="Required" />
            )}

            {comp.type === "Footer" && (
                <>
                    <Field label="Button label"><input className={inputCls} value={p.label} onChange={(e) => set({ label: e.target.value })} /></Field>
                    {screen.terminal ? (
                        <div className="rounded-md bg-emerald-50 px-2.5 py-2 text-[12px] text-emerald-700">
                            Terminal screen → this button submits the accumulated data (<code>data_exchange</code>).
                        </div>
                    ) : (
                        <Field label="Navigate to screen">
                            <select className={inputCls} value={p.nextScreen || ""} onChange={(e) => set({ nextScreen: e.target.value || null })}>
                                <option value="">— next screen —</option>
                                {screens.filter((s) => s.uid !== screen.uid).map((s) => <option key={s.uid} value={s.id}>{s.id}</option>)}
                            </select>
                        </Field>
                    )}
                </>
            )}
        </div>
    );
}

/* ---------- main ---------- */
export default function WhatsAppFlowBuilder() {
    const [flow, setFlow] = useState<Flow>(initialFlow);
    const [currentUid, setCurrentUid] = useState<string>(initialFlow.screens[0].uid);
    const [selUid, setSelUid] = useState<string | null>(null);
    const [showJson, setShowJson] = useState(true);
    const [copied, setCopied] = useState(false);
    const [dragType, setDragType] = useState<ComponentType | null>(null);
    const dropRef = useRef(false);

    const screen = flow.screens.find((s) => s.uid === currentUid) || flow.screens[0];
    const selected = screen?.children.find((c) => c.uid === selUid) || null;

    const json = useMemo(() => JSON.stringify(buildFlowJSON(flow), null, 2), [flow]);
    const issues = useMemo(() => validateFlow(flow), [flow]);
    const errors = issues.filter((i) => i.level === "error");
    const warns = issues.filter((i) => i.level === "warn");

    /* screen ops */
    const patchScreen = (uidv: string, patch: Partial<Screen>) => setFlow((f) => ({ ...f, screens: f.screens.map((s) => s.uid === uidv ? { ...s, ...patch } : s) }));
    const addScreen = () => {
        const n = flow.screens.length + 1;
        const s: Screen = { uid: uid(), id: `SCREEN_${n}`, title: `Screen ${n}`, terminal: false, children: [{ uid: uid(), type: "Footer", props: { label: "Continue", nextScreen: null } }] };
        setFlow((f) => ({ ...f, screens: [...f.screens, s] }));
        setCurrentUid(s.uid);
        setSelUid(null);
    };
    const deleteScreen = (uidv: string) => {
        if (flow.screens.length <= 1) return;
        setFlow((f) => ({ ...f, screens: f.screens.filter((s) => s.uid !== uidv) }));
        if (currentUid === uidv) {
            const next = flow.screens.find((s) => s.uid !== uidv);
            if (next) setCurrentUid(next.uid);
        }
    };

    /* component ops */
    const addComponent = (type: ComponentType) => {
        const c = { uid: uid(), type, props: defaults(type) };
        setFlow((f) => ({
            ...f,
            screens: f.screens.map((s) => {
                if (s.uid !== currentUid) return s;
                // keep footer last
                const footers = s.children.filter((x) => x.type === "Footer");
                const rest = s.children.filter((x) => x.type !== "Footer");
                return { ...s, children: type === "Footer" && footers.length ? s.children : [...rest, ...(type === "Footer" ? [] : []), c, ...footers] };
            }),
        }));
        setSelUid(c.uid);
    };
    const patchComponent = (uidv: string, props: ComponentProps) => setFlow((f) => ({
        ...f, screens: f.screens.map((s) => s.uid !== currentUid ? s : { ...s, children: s.children.map((c) => c.uid === uidv ? { ...c, props } : c) }),
    }));
    const removeComponent = (uidv: string) => {
        setFlow((f) => ({ ...f, screens: f.screens.map((s) => s.uid !== currentUid ? s : { ...s, children: s.children.filter((c) => c.uid !== uidv) }) }));
        if (selUid === uidv) setSelUid(null);
    };
    const moveComponent = (uidv: string, dir: number) => setFlow((f) => ({
        ...f, screens: f.screens.map((s) => {
            if (s.uid !== currentUid) return s;
            const arr = [...s.children];
            const i = arr.findIndex((c) => c.uid === uidv);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= arr.length) return s;
            [arr[i], arr[j]] = [arr[j], arr[i]];
            return { ...s, children: arr };
        }),
    }));

    const copyJson = async () => {
        try { await navigator.clipboard.writeText(json); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
    };
    const downloadJson = () => {
        const blob = new Blob([json], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = "flow.json"; a.click(); URL.revokeObjectURL(a.href);
    };
    const reset = () => { setFlow(initialFlow); setCurrentUid(initialFlow.screens[0].uid); setSelUid(null); };
    const [saveBlocked, setSaveBlocked] = useState(false);
    const saveFlow = () => {
        if (errors.length > 0) {
            setSaveBlocked(true);
            setShowJson(true);
            setTimeout(() => setSaveBlocked(false), 2000);
            return;
        }
        downloadJson();
    };

    return (
        <div className="flex h-[100%] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-100 text-gray-900" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
            {/* header */}
            <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2.5">
                <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg text-white" style={{ backgroundColor: WA_GREEN }}><Glyph ch="📱" size={16} /></span>
                    <span className="text-[14px] font-semibold">WhatsApp Flow builder</span>
                </div>
                <div className="mx-1 flex items-center gap-1.5 text-[12px]">
                    <span className="text-gray-500">Flow</span>
                    <span className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-1 text-[12px] font-medium text-gray-700">{flow.version}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px]">
                    <span className="text-gray-500">Data API</span>
                    <span className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-1 text-[12px] font-medium text-gray-700">{flow.dataApiVersion}</span>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    {errors.length === 0
                        ? <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700"><Glyph ch="✓" size={13} /> Valid{warns.length ? ` · ${warns.length} tip${warns.length > 1 ? "s" : ""}` : ""}</span>
                        : <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[12px] font-medium text-red-600"><Glyph ch="⚠" size={13} /> {errors.length} issue{errors.length > 1 ? "s" : ""}</span>}
                    <button onClick={() => setShowJson((v) => !v)} className="flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-[12px] font-medium text-gray-700 hover:bg-gray-50"><Glyph ch="{}" size={13} /> JSON</button>
                    <button onClick={saveFlow} className={`flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-white ${saveBlocked ? "bg-red-500" : ""}`} style={saveBlocked ? undefined : { backgroundColor: WA_TEAL }}>
                        {saveBlocked ? <Glyph ch="⚠" size={13} /> : <Glyph ch="✓" size={13} />}{saveBlocked ? `Fix ${errors.length} error${errors.length > 1 ? "s" : ""}` : "Save"}
                    </button>
                    <button onClick={copyJson} className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-white" style={{ backgroundColor: WA_GREEN }}>{copied ? <Glyph ch="✓" size={13} /> : <Glyph ch="⧉" size={13} />}{copied ? "Copied" : "Copy"}</button>
                    <button onClick={downloadJson} className="flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-[12px] font-medium text-gray-700 hover:bg-gray-50"><Glyph ch="⬇" size={13} /></button>
                    <button onClick={reset} className="flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-[12px] font-medium text-gray-700 hover:bg-gray-50"><Glyph ch="↺" size={13} /></button>
                </div>
            </div>

            <div className="flex min-h-0 flex-1">
                {/* left: screens + palette */}
                <div className="flex w-52 shrink-0 flex-col border-r border-gray-200 bg-white">
                    <div className="flex items-center justify-between px-3 pt-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Screens</span>
                        <button onClick={addScreen} className="rounded p-0.5 text-emerald-600 hover:bg-emerald-50" aria-label="Add screen"><Glyph ch="+" size={15} /></button>
                    </div>
                    <div className="space-y-1 px-2 py-2">
                        {flow.screens.map((s) => (
                            <div key={s.uid} onClick={() => { setCurrentUid(s.uid); setSelUid(null); }}
                                className={`group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] ${s.uid === currentUid ? "bg-emerald-50 text-emerald-800" : "text-gray-700 hover:bg-gray-50"}`}>
                                <Glyph ch="📱" size={13} className="shrink-0 opacity-60" />
                                <span className="truncate">{s.id}</span>
                                {s.terminal && <span className="ml-auto rounded bg-gray-200 px-1 text-[9px] font-semibold text-gray-500">END</span>}
                                {flow.screens.length > 1 && (
                                    <button onClick={(e) => { e.stopPropagation(); deleteScreen(s.uid); }} className="ml-auto hidden rounded p-0.5 text-gray-400 hover:text-red-500 group-hover:block" aria-label="Delete screen"><Glyph ch="🗑" size={12} /></button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-1 border-t border-gray-100 px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Components</div>
                    <div className="flex-1 space-y-3 overflow-y-auto px-2 py-2">
                        {PALETTE.map((grp) => (
                            <div key={grp.group}>
                                <div className="mb-1 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400"><Glyph ch={grp.icon} size={11} /> {grp.group}</div>
                                <div className="space-y-1">
                                    {grp.items.map((t) => (
                                        <button key={t} draggable onDragStart={() => setDragType(t)} onDragEnd={() => setDragType(null)}
                                            onClick={() => addComponent(t)}
                                            className="flex w-full cursor-grab items-center justify-between rounded-md border border-gray-200 bg-white px-2 py-1.5 text-left text-[12px] text-gray-700 hover:border-emerald-400 hover:bg-emerald-50 active:cursor-grabbing">
                                            {META[t].label}<Glyph ch="+" size={12} className="opacity-40" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* center: screen bar + phone preview */}
                <div className="flex min-w-0 flex-1 flex-col bg-gray-100">
                    {/* screen settings bar */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-2">
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">ID</span>
                            <input className="w-32 rounded-md border border-gray-300 px-2 py-1 text-[12px] font-mono" value={screen.id}
                                onChange={(e) => patchScreen(screen.uid, { id: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Title</span>
                            <input className="w-40 rounded-md border border-gray-300 px-2 py-1 text-[12px]" value={screen.title} onChange={(e) => patchScreen(screen.uid, { title: e.target.value })} />
                        </div>
                        <div className="ml-auto"><Toggle checked={screen.terminal} onChange={(v) => patchScreen(screen.uid, { terminal: v })} label="Terminal (final) screen" /></div>
                    </div>

                    {/* phone */}
                    <div className="flex flex-1 items-center justify-center overflow-y-auto p-5">
                        <div className="w-[300px] overflow-hidden rounded-[28px] border-[6px] border-gray-800 bg-gray-800 shadow-xl">
                            {/* WA header */}
                            <div className="flex items-center gap-2 px-3 py-2 text-white" style={{ backgroundColor: WA_HEADER }}>
                                <div className="h-6 w-6 rounded-full bg-white/25" />
                                <span className="text-[12px] font-medium">Your Business</span>
                            </div>
                            {/* flow sheet */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); dropRef.current = true; }}
                                onDrop={(e) => { e.preventDefault(); if (dragType) addComponent(dragType); setDragType(null); }}
                                className="flex h-[520px] flex-col bg-white">
                                <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5">
                                    <Glyph ch="×" size={17} className="text-gray-500" />
                                    <span className="text-[14px] font-semibold text-gray-900">{screen.title || "Untitled"}</span>
                                </div>
                                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                                    {screen.children.filter((c) => c.type !== "Footer").length === 0 && (
                                        <div className="mt-10 rounded-lg border-2 border-dashed border-gray-200 px-3 py-8 text-center text-[12px] text-gray-400">
                                            {dragType ? "Drop to add" : "Click or drag components here"}
                                        </div>
                                    )}
                                    {screen.children.filter((c) => c.type !== "Footer").map((c) => {
                                        const isSel = c.uid === selUid;
                                        return (
                                            <div key={c.uid} onClick={() => setSelUid(c.uid)}
                                                className={`group relative cursor-pointer rounded-lg px-1.5 py-1 ${isSel ? "ring-2 ring-emerald-400" : "hover:bg-gray-50"}`}>
                                                <PreviewComponent c={c} />
                                                <div className={`absolute -right-1 -top-2 z-10 flex items-center gap-0.5 rounded-md bg-white px-0.5 shadow ${isSel ? "flex" : "hidden group-hover:flex"}`}>
                                                    <button onClick={(e) => { e.stopPropagation(); moveComponent(c.uid, -1); }} className="rounded p-0.5 text-gray-400 hover:text-gray-700" aria-label="Move up"><Glyph ch="▲" size={13} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); moveComponent(c.uid, 1); }} className="rounded p-0.5 text-gray-400 hover:text-gray-700" aria-label="Move down"><Glyph ch="▼" size={13} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); removeComponent(c.uid); }} className="rounded p-0.5 text-gray-400 hover:text-red-500" aria-label="Delete"><Glyph ch="🗑" size={12} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* footer */}
                                {screen.children.filter((c) => c.type === "Footer").map((c) => {
                                    const isSel = c.uid === selUid;
                                    return (
                                        <div key={c.uid} onClick={() => setSelUid(c.uid)} className={`cursor-pointer border-t border-gray-100 p-3 ${isSel ? "ring-2 ring-inset ring-emerald-400" : ""}`}>
                                            <div className="rounded-full py-2.5 text-center text-[14px] font-semibold text-white" style={{ backgroundColor: WA_GREEN }}>{c.props.label || "Button"}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* right: properties */}
                <div className="w-72 shrink-0 overflow-y-auto border-l border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Properties</div>
                    <PropertyEditor comp={selected} screen={screen} screens={flow.screens} onProps={(props) => { if (selected) patchComponent(selected.uid, props); }} />
                </div>
            </div>

            {/* JSON drawer */}
            {showJson && (
                <div className="flex h-56 shrink-0 flex-col border-t border-gray-200 bg-gray-900">
                    <div className="flex items-center justify-between px-4 py-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Flow JSON</span>
                        <div className="flex items-center gap-2">
                            {issues.length > 0 && (
                                <span className="text-[11px] text-gray-400">{errors.length} error{errors.length !== 1 ? "s" : ""}, {warns.length} tip{warns.length !== 1 ? "s" : ""}</span>
                            )}
                            <button onClick={() => setShowJson(false)} className="rounded p-0.5 text-gray-500 hover:text-gray-300"><Glyph ch="×" size={14} /></button>
                        </div>
                    </div>
                    <div className="grid min-h-0 flex-1 grid-cols-[1fr_240px] gap-0">
                        <pre className="overflow-auto px-4 py-2 text-[11px] leading-relaxed text-emerald-200">{json}</pre>
                        <div className="overflow-auto border-l border-gray-800 px-3 py-2">
                            {issues.length === 0 ? (
                                <div className="flex items-center gap-1 text-[12px] text-emerald-400"><Glyph ch="✓" size={13} /> No issues</div>
                            ) : (
                                <ul className="space-y-1.5">
                                    {issues.map((it, i) => (
                                        <li key={i} className={`flex items-start gap-1.5 text-[11px] leading-snug ${it.level === "error" ? "text-red-300" : "text-amber-300"}`}>
                                            <Glyph ch="⚠" size={12} className="mt-0.5 shrink-0" />{it.msg}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}