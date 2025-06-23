import { Injectable } from '@angular/core';
import { GraphData } from '../modes/file.mode';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private currentFileName: string | null = null;

  async saveGraph(data: GraphData): Promise<void> {
    if (this.currentFileName) {
      this.downloadJSON(data, this.currentFileName);
    } else {
      await this.saveGraphAs(data);
    }
  }

  async saveGraphAs(data: GraphData): Promise<void> {
    const fileName = prompt('Enter filename:', this.currentFileName || 'graph.json');
    if (fileName) {
      this.currentFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
      this.downloadJSON(data, this.currentFileName);
    }
  }

  async openGraph(): Promise<GraphData | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            const text = await file.text();
            const data = JSON.parse(text) as GraphData;
            this.currentFileName = file.name;
            
            // Validate the data structure
            if (this.validateGraphData(data)) {
              resolve(data);
            } else {
              alert('Invalid graph file format');
              resolve(null);
            }
          } catch (error) {
            console.error('Error reading file:', error);
            alert('Error reading file');
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      
      input.click();
    });
  }

  private downloadJSON(data: GraphData, fileName: string): void {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  private validateGraphData(data: any): data is GraphData {
    return (
      data &&
      typeof data.version === 'string' &&
      data.metadata &&
      Array.isArray(data.nodes) &&
      Array.isArray(data.pins) &&
      Array.isArray(data.connections)
    );
  }

  getCurrentFileName(): string | null {
    return this.currentFileName;
  }

  setCurrentFileName(fileName: string | null): void {
    this.currentFileName = fileName;
  }
}