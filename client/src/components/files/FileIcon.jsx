import React from 'react';
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileSpreadsheet,
  FileCode,
  File
} from 'lucide-react';

const FileIcon = ({ mimeType = '', fileName = '', className = 'w-5 h-5' }) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return <FileImage className={`${className} text-rose-500`} />;
  }
  if (mimeType.includes('pdf') || ext === 'pdf') {
    return <FileText className={`${className} text-red-500`} />;
  }
  if (
    mimeType.includes('sheet') ||
    mimeType.includes('excel') ||
    ['xls', 'xlsx', 'csv'].includes(ext)
  ) {
    return <FileSpreadsheet className={`${className} text-emerald-600`} />;
  }
  if (
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    ['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)
  ) {
    return <FileText className={`${className} text-blue-500`} />;
  }
  if (mimeType.includes('video') || ['mp4', 'mkv', 'avi', 'mov'].includes(ext)) {
    return <FileVideo className={`${className} text-purple-500`} />;
  }
  if (mimeType.includes('audio') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
    return <FileAudio className={`${className} text-amber-500`} />;
  }
  if (
    mimeType.includes('zip') ||
    mimeType.includes('archive') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return <FileArchive className={`${className} text-indigo-500`} />;
  }
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java'].includes(ext)) {
    return <FileCode className={`${className} text-cyan-600`} />;
  }

  return <File className={`${className} text-slate-400`} />;
};

export default FileIcon;
