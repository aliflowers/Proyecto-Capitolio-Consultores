'use client';

import { useState, useEffect, useRef } from 'react';
import { Viewer, Worker, RotateDirection } from '@react-pdf-viewer/core';
import { toolbarPlugin, ToolbarSlot } from '@react-pdf-viewer/toolbar';
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail';
import { searchPlugin } from '@react-pdf-viewer/search';
import { fullScreenPlugin } from '@react-pdf-viewer/full-screen';
import { bookmarkPlugin } from '@react-pdf-viewer/bookmark';
import { printPlugin } from '@react-pdf-viewer/print';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';
import '@react-pdf-viewer/thumbnail/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';
import '@react-pdf-viewer/full-screen/lib/styles/index.css';
import '@react-pdf-viewer/bookmark/lib/styles/index.css';
import '@react-pdf-viewer/print/lib/styles/index.css';
import '@/app/excel-viewer.css';

export default function DocumentViewerClient({ document }: { document: any }) {
  if (!document) return null;

  const fileUrl = `/api/files/${document.path}`;
  const isPdf = document.mime_type === 'application/pdf';
  const isImage = document.mime_type && document.mime_type.startsWith('image');
  const isWord = document.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const isExcel = document.mime_type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const xlsxContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderOfficeDoc = async () => {
      setLoading(true);
      try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();

        if (isWord && docxContainerRef.current) {
          await renderAsync(blob, docxContainerRef.current);
        } else if (isExcel) {
          const data = await blob.arrayBuffer();
          const wb = XLSX.read(data, { type: 'array' });
          setWorkbook(wb);
          setSheets(wb.SheetNames);
          setActiveSheet(wb.SheetNames[0]);
        }
      } catch (error) {
        console.error('Error rendering document:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isWord || isExcel) {
      renderOfficeDoc();
    } else {
      setLoading(false);
    }
  }, [fileUrl, isWord, isExcel]);

  useEffect(() => {
    if (workbook && activeSheet && xlsxContainerRef.current) {
      try {
        const worksheet = workbook.Sheets[activeSheet];
        if (worksheet) {
          // Convertir la hoja a un array de arrays, eliminando filas y columnas vacías
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          // Filtrar filas vacías al final
          while (data.length > 0 && data[data.length - 1].every(cell => cell === null || cell === undefined || cell === '')) {
            data.pop();
          }

          // Crear una nueva hoja solo con los datos relevantes
          const newWorksheet = XLSX.utils.aoa_to_sheet(data);
          const html = XLSX.utils.sheet_to_html(newWorksheet);
          
          xlsxContainerRef.current.innerHTML = html;
        } else {
          xlsxContainerRef.current.innerHTML = '<p class="text-red-500">Error: No se pudo encontrar la hoja de cálculo seleccionada.</p>';
        }
      } catch (error) {
        console.error('Error rendering worksheet:', error);
        xlsxContainerRef.current.innerHTML = '<p class="text-red-500">Error: No se pudo previsualizar esta hoja de cálculo.</p>';
      }
    }
  }, [workbook, activeSheet]);

  const handleZoomIn = () => setZoom(prev => prev + 0.1);
  const handleZoomOut = () => setZoom(prev => Math.max(0.1, prev - 0.1));
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = document.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toolbarPluginInstance = toolbarPlugin();
  const { Toolbar } = toolbarPluginInstance;
  const thumbnailPluginInstance = thumbnailPlugin();
  const { Thumbnails } = thumbnailPluginInstance;
  const searchPluginInstance = searchPlugin();
  const { Search } = searchPluginInstance;
  const fullScreenPluginInstance = fullScreenPlugin();
  const { EnterFullScreen } = fullScreenPluginInstance;
  const bookmarkPluginInstance = bookmarkPlugin();
  const { Bookmarks } = bookmarkPluginInstance;
  const printPluginInstance = printPlugin();
  const { Print } = printPluginInstance;

  return (
    <div className="w-full">
      {loading && (
        <div className="text-center p-4">
          <p>Cargando vista previa...</p>
        </div>
      )}
      <div style={{ display: loading ? 'none' : 'block' }} className="w-full">
        {isImage ? (
          <div className="flex justify-center">
            <img 
              src={fileUrl} 
              alt={`Previsualización de ${document.name}`} 
              className="max-w-full h-auto rounded-md border"
            />
          </div>
        ) : isPdf ? (
          <div className="flex h-[80vh] pdf-viewer-container">
            <div className="flex-1 overflow-hidden">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <div className="flex flex-col h-full">
                  <div className="bg-gray-100 p-2 flex items-center">
                    <Toolbar>
                      {(props: ToolbarSlot) => {
                        const {
                          CurrentPageInput,
                          Download,
                          EnterFullScreen,
                          GoToNextPage,
                          GoToPreviousPage,
                          NumberOfPages,
                          Print,
                          Rotate,
                          ZoomIn,
                          ZoomOut,
                        } = props;
                        return (
                          <>
                            <div className="flex items-center">
                              <GoToPreviousPage />
                              <div className="mx-2">
                                <CurrentPageInput /> / <NumberOfPages />
                              </div>
                              <GoToNextPage />
                            </div>
                            <div className="flex items-center ml-auto">
                              <ZoomOut />
                              <div className="mx-2"><ZoomIn /></div>
                              <Rotate direction={RotateDirection.Forward} />
                              <Rotate direction={RotateDirection.Backward} />
                              <Print />
                              <Download />
                              <EnterFullScreen />
                            </div>
                          </>
                        );
                      }}
                    </Toolbar>
                  </div>
                  <div className="flex-1 overflow-hidden flex">
                    <div className="w-64 border-r overflow-auto">
                      <Thumbnails />
                    </div>
                    <div className="flex-1 overflow-auto">
                      <Viewer
                        fileUrl={fileUrl}
                        plugins={[
                          toolbarPluginInstance,
                          thumbnailPluginInstance,
                          searchPluginInstance,
                          fullScreenPluginInstance,
                          bookmarkPluginInstance,
                          printPluginInstance,
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </Worker>
            </div>
          </div>
        ) : isWord || isExcel ? (
          <div>
            <div className="bg-gray-100 p-2 flex items-center sticky top-0 z-10">
              <button onClick={handleZoomOut} className="px-2 py-1 border rounded-md bg-white">-</button>
              <span className="mx-2">{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomIn} className="px-2 py-1 border rounded-md bg-white">+</button>
              {isExcel && sheets.length > 1 && (
                <select 
                  value={activeSheet} 
                  onChange={(e) => setActiveSheet(e.target.value)}
                  className="ml-4 px-2 py-1 border rounded-md bg-white"
                >
                  {sheets.map(sheet => <option key={sheet} value={sheet}>{sheet}</option>)}
                </select>
              )}
              <button onClick={handleDownload} className="ml-auto px-2 py-1 border rounded-md bg-white">Descargar</button>
            </div>
            <div 
              className="p-4 border rounded-md bg-white overflow-auto excel-viewer-container" 
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            >
              {isWord && <div ref={docxContainerRef}></div>}
              {isExcel && <div ref={xlsxContainerRef}></div>}
            </div>
          </div>
        ) : (
          <div className="text-center p-4 border rounded-md bg-gray-50">
            <p className="font-semibold text-lg">Vista previa no disponible</p>
            <p className="text-sm text-gray-600 mt-1">No se puede previsualizar el tipo de archivo: {document.mime_type}</p>
            <a href={fileUrl} download={document.name} className="text-blue-600 hover:underline mt-4 inline-block bg-blue-100 px-4 py-2 rounded-md">
              Descargar archivo
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
