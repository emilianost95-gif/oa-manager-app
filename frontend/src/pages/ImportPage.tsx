import { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  Upload,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, api, downloadFile, request } from '../lib/api';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';
import { PRIORITY_LABEL, STATUS_LABEL } from '../lib/labels';
import { DemoNotice } from '../components/guide/DemoNotice';
import { useGuide } from '../context/GuideContext';
import type { ImportPreview, ImportResult } from '../types';

const EXPECTED_COLUMNS = [
  'codigo',
  'titulo',
  'descripcion',
  'curso',
  'asignatura',
  'unidad',
  'prioridad',
  'estado',
  'observaciones',
];

export function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const queryClient = useQueryClient();
  const { isDemo } = useGuide();

  const previewMutation = useMutation({
    mutationFn: (selected: File) => {
      const formData = new FormData();
      formData.append('file', selected);
      return request<ImportPreview>('/import/preview', { method: 'POST', body: formData });
    },
    onSuccess: (data) => {
      setPreview(data);
      setResult(null);
      if (data.summary.invalid > 0) {
        toast(`${data.summary.invalid} fila(s) con errores. Revisa el detalle abajo.`, {
          icon: '⚠️',
        });
      } else {
        toast.success('Archivo leído correctamente. Revisa la vista previa.');
      }
    },
    onError: (error) => {
      setPreview(null);
      toast.error(error instanceof ApiError ? error.message : 'No pudimos leer el archivo.');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      api.post<ImportResult>('/import/confirm', {
        skipDuplicates,
        rows: (preview?.rows ?? []).filter((r) => r.valid).map((r) => r.data),
      }),
    onSuccess: (data) => {
      setResult(data);
      setPreview(null);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      void queryClient.invalidateQueries();
      toast.success(`Importación completada: ${data.created} objetivo(s) creados.`);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'No pudimos completar la importación.',
      );
    },
  });

  const handleFile = (selected: File | null) => {
    if (isDemo) {
      toast.error('La importación no está disponible en el modo demo.');
      return;
    }
    setFile(selected);
    setResult(null);
    setPreview(null);
    if (selected) previewMutation.mutate(selected);
  };

  const validRows = preview?.rows.filter((r) => r.valid) ?? [];

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-slate-900">Importar objetivos</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Carga un archivo CSV o Excel con tus Objetivos de Aprendizaje. Primero verás una vista
          previa y podrás revisar los errores antes de guardar.
        </p>
      </header>

      <DemoNotice feature="La importación" />

      <section className="card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 text-sm text-slate-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            <div>
              <p className="font-medium text-slate-800">Columnas esperadas</p>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {EXPECTED_COLUMNS.join(' · ')}
              </p>
              <p className="mt-1.5 text-xs text-slate-500">
                Obligatorias: <span className="font-medium">codigo, titulo, curso, asignatura</span>.
                Estado: pendiente / en proceso / logrado. Prioridad: baja / media / alta.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="shrink-0"
            disabled={isDemo}
            icon={<Download className="h-4 w-4" aria-hidden />}
            onClick={() =>
              void downloadFile('/import/template', {}, 'plantilla-objetivos.csv').catch(() =>
                toast.error('No pudimos descargar la plantilla.'),
              )
            }
          >
            Descargar plantilla
          </Button>
        </div>
      </section>

      <section
        className={cn(
          'card flex flex-col items-center justify-center border-2 border-dashed p-10 text-center transition',
          dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300',
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) handleFile(dropped);
        }}
      >
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <FileSpreadsheet className="h-7 w-7" aria-hidden />
        </span>
        <p className="text-base font-semibold text-slate-900">
          Arrastra tu archivo aquí o selecciónalo
        </p>
        <p className="mt-1 text-sm text-slate-500">Formatos aceptados: .csv y .xlsx (máx. 5 MB)</p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xlsm"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={isDemo}
            loading={previewMutation.isPending}
            loadingText="Leyendo archivo..."
            icon={<Upload className="h-4 w-4" aria-hidden />}
          >
            Seleccionar archivo
          </Button>
          {file && (
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
              {file.name}
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                aria-label="Quitar archivo"
                className="rounded-full p-0.5 hover:bg-slate-200"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </span>
          )}
        </div>
      </section>

      {result && (
        <section className="card border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
            <div className="text-sm text-emerald-900">
              <p className="font-semibold">Importación completada</p>
              <ul className="mt-2 space-y-1">
                <li>{result.created} objetivo(s) creados.</li>
                {result.skipped > 0 && <li>{result.skipped} fila(s) omitidas por duplicado.</li>}
                {result.createdCourses.length > 0 && (
                  <li>Cursos creados: {result.createdCourses.join(', ')}</li>
                )}
                {result.createdSubjects.length > 0 && (
                  <li>Asignaturas creadas: {result.createdSubjects.join(', ')}</li>
                )}
                {result.createdUnits.length > 0 && (
                  <li>Unidades creadas: {result.createdUnits.join(', ')}</li>
                )}
              </ul>
            </div>
          </div>
        </section>
      )}

      {preview && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Filas leídas', value: preview.summary.total, tone: 'text-slate-900' },
              { label: 'Válidas', value: preview.summary.valid, tone: 'text-emerald-600' },
              { label: 'Con errores', value: preview.summary.invalid, tone: 'text-rose-600' },
              { label: 'Duplicadas', value: preview.summary.duplicates, tone: 'text-amber-600' },
            ].map((s) => (
              <div key={s.label} className="card p-4">
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className={cn('mt-1 text-2xl font-bold tabular-nums', s.tone)}>{s.value}</p>
              </div>
            ))}
          </section>

          {(preview.summary.newSubjects.length > 0 ||
            preview.summary.newCourses.length > 0 ||
            preview.summary.newUnits.length > 0) && (
            <section className="card border-brand-200 bg-brand-50 p-5 text-sm text-brand-900">
              <p className="font-semibold">Se crearán automáticamente</p>
              <ul className="mt-2 space-y-1">
                {preview.summary.newCourses.length > 0 && (
                  <li>Cursos: {preview.summary.newCourses.join(', ')}</li>
                )}
                {preview.summary.newSubjects.length > 0 && (
                  <li>Asignaturas: {preview.summary.newSubjects.join(', ')}</li>
                )}
                {preview.summary.newUnits.length > 0 && (
                  <li>Unidades: {preview.summary.newUnits.join(', ')}</li>
                )}
              </ul>
            </section>
          )}

          <section className="card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Vista previa · {preview.fileName}
              </h3>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Omitir duplicados
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="hidden w-full text-left text-sm md:table">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Fila</th>
                    <th className="px-4 py-3 font-medium">Código</th>
                    <th className="px-4 py-3 font-medium">Título</th>
                    <th className="px-4 py-3 font-medium">Asignatura</th>
                    <th className="px-4 py-3 font-medium">Curso</th>
                    <th className="px-4 py-3 font-medium">Unidad</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.rows.map((row) => (
                    <tr key={row.rowNumber} className={row.valid ? '' : 'bg-rose-50/60'}>
                      <td className="px-4 py-3 tabular-nums text-slate-500">{row.rowNumber}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.data?.codigo ?? row.raw.codigo ?? '—'}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3">
                        {row.data?.titulo ?? row.raw.titulo ?? '—'}
                      </td>
                      <td className="px-4 py-3">{row.data?.asignatura ?? row.raw.asignatura}</td>
                      <td className="px-4 py-3">{row.data?.curso ?? row.raw.curso}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {row.data?.unidad ?? row.raw.unidad ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {row.data ? STATUS_LABEL[row.data.estado] : row.raw.estado}
                      </td>
                      <td className="px-4 py-3">
                        {row.valid ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Lista
                          </span>
                        ) : (
                          <ul className="space-y-0.5 text-xs text-rose-700">
                            {row.issues.map((issue, i) => (
                              <li key={i}>
                                <span className="font-semibold">{issue.field}:</span>{' '}
                                {issue.message}
                              </li>
                            ))}
                          </ul>
                        )}
                        {row.warnings.map((w, i) => (
                          <p key={i} className="mt-1 text-xs text-amber-700">
                            {w}
                          </p>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Vista en tarjetas para móvil */}
              <ul className="divide-y divide-slate-100 md:hidden">
                {preview.rows.map((row) => (
                  <li key={row.rowNumber} className={cn('p-4', !row.valid && 'bg-rose-50/60')}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-slate-500">
                        Fila {row.rowNumber} · {row.data?.codigo ?? row.raw.codigo ?? '—'}
                      </span>
                      {row.valid ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Lista
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700">
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Con errores
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {row.data?.titulo ?? row.raw.titulo ?? '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {row.data?.asignatura ?? row.raw.asignatura} ·{' '}
                      {row.data?.curso ?? row.raw.curso} ·{' '}
                      {row.data ? PRIORITY_LABEL[row.data.prioridad] : row.raw.prioridad}
                    </p>
                    {row.issues.map((issue, i) => (
                      <p key={i} className="mt-1 text-xs text-rose-700">
                        <span className="font-semibold">{issue.field}:</span> {issue.message}
                      </p>
                    ))}
                    {row.warnings.map((w, i) => (
                      <p key={i} className="mt-1 text-xs text-amber-700">
                        {w}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Se importarán <span className="font-semibold">{validRows.length}</span> objetivo(s).
                {preview.summary.invalid > 0 &&
                  ` Las ${preview.summary.invalid} fila(s) con errores se omitirán.`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreview(null);
                    setFile(null);
                    if (inputRef.current) inputRef.current.value = '';
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => confirmMutation.mutate()}
                  disabled={validRows.length === 0}
                  loading={confirmMutation.isPending}
                  loadingText="Importando..."
                  icon={<Upload className="h-4 w-4" aria-hidden />}
                >
                  Confirmar importación
                </Button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
