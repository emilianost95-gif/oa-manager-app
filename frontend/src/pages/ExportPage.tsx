import { useMemo, useState } from 'react';
import { FileSpreadsheet, FileText, FileType2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { EMPTY_FILTERS, countActiveFilters, filtersToQuery, useObjectives } from '../hooks/useObjectives';
import { useCourses, useSubjects, useUnits } from '../hooks/useCatalog';
import { ObjectiveFilters } from '../components/objectives/ObjectiveFilters';
import { Button } from '../components/ui/Button';
import { downloadFile } from '../lib/api';
import type { ObjectiveFiltersState } from '../types';

type Format = 'csv' | 'xlsx' | 'pdf';

const FORMATS: {
  key: Format;
  title: string;
  description: string;
  icon: typeof FileText;
  extension: string;
}[] = [
  {
    key: 'csv',
    title: 'CSV',
    description: 'Archivo de texto separado por comas, compatible con cualquier planilla.',
    icon: FileText,
    extension: 'csv',
  },
  {
    key: 'xlsx',
    title: 'Excel',
    description: 'Planilla con formato, filtros y una hoja de resumen.',
    icon: FileSpreadsheet,
    extension: 'xlsx',
  },
  {
    key: 'pdf',
    title: 'PDF',
    description: 'Listado impreso, ideal para llevar a reuniones.',
    icon: FileType2,
    extension: 'pdf',
  },
];

export function ExportPage() {
  const [filters, setFilters] = useState<ObjectiveFiltersState>(EMPTY_FILTERS);
  const [expanded, setExpanded] = useState(true);
  const [downloading, setDownloading] = useState<Format | null>(null);

  const { data: courses = [] } = useCourses();
  const { data: subjects = [] } = useSubjects();
  const { data: units = [] } = useUnits();
  const { data, isFetching } = useObjectives(filters, 1, 1);

  const activeCount = countActiveFilters(filters);
  const query = useMemo(() => filtersToQuery(filters), [filters]);

  const handleDownload = async (format: Format, extension: string) => {
    setDownloading(format);
    try {
      await downloadFile(`/export/${format}`, query, `objetivos.${extension}`);
      toast.success('Archivo generado correctamente.');
    } catch {
      toast.error('No pudimos generar el archivo. Inténtalo nuevamente.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-slate-900">Exportar objetivos</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          La exportación respeta exactamente los filtros que elijas abajo.
        </p>
      </header>

      <ObjectiveFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(EMPTY_FILTERS)}
        courses={courses}
        subjects={subjects}
        units={units}
        activeCount={activeCount}
        expanded={expanded}
        onToggleExpanded={() => setExpanded((v) => !v)}
      />

      <div className="card flex flex-col gap-1 p-5">
        <p className="text-sm text-slate-500">Objetivos que se exportarán</p>
        <p className="text-3xl font-bold tabular-nums text-slate-900">
          {isFetching && !data ? '—' : (data?.total ?? 0)}
        </p>
        {activeCount > 0 && (
          <p className="text-xs text-slate-500">Con {activeCount} filtro(s) aplicado(s).</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {FORMATS.map(({ key, title, description, icon: Icon, extension }) => (
          <section key={key} className="card flex flex-col p-5">
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 flex-1 text-sm text-slate-600">{description}</p>
            <Button
              className="mt-5 w-full justify-center"
              variant={key === 'xlsx' ? 'primary' : 'outline'}
              loading={downloading === key}
              loadingText="Generando..."
              disabled={(data?.total ?? 0) === 0}
              onClick={() => void handleDownload(key, extension)}
            >
              Exportar {title}
            </Button>
          </section>
        ))}
      </div>
    </div>
  );
}
