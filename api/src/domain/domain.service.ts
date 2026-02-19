import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';
import { MatchMode } from './dto/search-domains.dto';

const execAsync = promisify(exec);

@Injectable()
export class DomainService {
  private readonly logger = new Logger(DomainService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async refineDescription(description: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en marketing et branding. Reformule et complète la description suivante pour en extraire l\'essence et la valeur ajoutée du produit. Sois concis mais percutant.',
          },
          { role: 'user', content: description },
        ],
        max_tokens: 200,
      });

      return response.choices[0].message.content?.trim() ?? '';
    } catch (error) {
      this.logger.error('Erreur lors de la reformulation IA:', error);
      throw error;
    }
  }

  async suggestProjectName(description: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en branding. Suggère UNIQUEMENT un seul mot (nom propre ou mot inventé) qui soit extrêmement évocateur, moderne et mémorisable pour le projet décrit. Pas de ponctuation, pas de phrase.',
          },
          { role: 'user', content: description },
        ],
        max_tokens: 10,
      });

      return response.choices[0].message.content?.trim().replace(/[^a-zA-Z0-9]/g, '') ?? '';
    } catch (error) {
      this.logger.error('Erreur lors de la suggestion du nom de projet:', error);
      return '';
    }
  }

  async generateKeywords(description: string, locale?: string): Promise<string[]> {
    const localeInstruction = locale
      ? `Generate keywords primarily in the language with code "${locale}", culturally adapted for that market. Include both native-language terms and commonly used English loanwords in this market.`
      : 'Generate keywords in English, suitable for an international audience.';

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an SEO and semantics expert.
            Identify AT LEAST 20 relevant keywords and associated terms for the following description.
            Vary the angles: synonyms, technical terms, user benefits, and abstract concepts related to the domain.
            ${localeInstruction}
            Return ONLY a comma-separated list of words, no numbering.`,
          },
          { role: 'user', content: description },
        ],
        max_tokens: 300,
        temperature: 0.8,
      });

      const content = response.choices[0].message.content;
      if (!content) return [];
      return content.split(',').map(k => k.trim()).filter(k => k.length > 0);
    } catch (error) {
      this.logger.error('Erreur lors de la génération des mots-clés:', error);
      throw error;
    }
  }

  async generateDomainIdeas(description: string, keywords: string[], locale?: string): Promise<string[]> {
    const vocabStr = keywords.join(', ');
    const localeInstruction = locale
      ? `Names should resonate with a "${locale}"-language audience. Prefer names that are easy to pronounce in that language, and may incorporate roots, sounds, or cultural references familiar to its speakers. Local or regional words are encouraged alongside invented ones.`
      : 'Names should be internationally friendly — easy to pronounce for a global audience, preferring Anglo-Saxon or Latin roots.';

    const prompt = `
      You are a world-class branding and naming expert.
      Your mission is to generate 30 powerful brand names for the following project:
      Description: "${description}"
      Semantic keywords: ${vocabStr}

      Quality criteria (MANDATORY):
      1. Short (2-3 syllables max).
      2. Easy to pronounce and spell (must pass the "radio test").
      3. Avoid numbers and hyphens.
      4. Modern and memorable sound.

      ${localeInstruction}

      Use a mix of these naming techniques:
      - Portmanteaus (merging 2 relevant words).
      - Short, elegant compound words.
      - Evocative names (metaphors linked to the client benefit).
      - Invented names with a strong Latin or language-appropriate root.

      Your response must be ONLY a JSON object with a "names" key containing a list of strings (name only, no extension).
      Example: {"names": ["Altro", "Velora", "Flowly"]}
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.95,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) return [];
      
      const parsed = JSON.parse(content);
      const names: string[] = parsed.names || [];
      
      return names
        .map(name => name.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
        .filter(name => name.length > 3);
    } catch (error) {
      this.logger.error('Erreur lors de la génération des noms:', error);
      return [];
    }
  }

  async isDomainAvailable(domain: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`whois ${domain}`, { timeout: 10000 });
      const output = stdout.toLowerCase();

      // Check "available" patterns first — some TLDs (.io, .co, etc.) include
      // registrar info for the TLD itself before the "no match" message.
      const availablePatterns = [
        'no match for',
        'no match',
        'not found',
        'no entries found',
        'no data found',
        'status: available',
        'domain not found',
        'is available',
      ];
      if (availablePatterns.some(p => output.includes(p))) return true;

      const takenPatterns = [
        'domain name:',
        'registrar:',
        'creation date:',
        'registry domain id:',
        'reserved',
      ];
      return !takenPatterns.some(pattern => output.includes(pattern));
    } catch (error: any) {
      const errorMsg = error.stdout?.toLowerCase() || error.message?.toLowerCase() || '';
      return errorMsg.includes('no match') || errorMsg.includes('not found') || errorMsg.includes('available');
    }
  }

  async recheckAvailability(
    names: string[],
    extensions: string[],
  ): Promise<{ name: string; allExtensions: Record<string, boolean> }[]> {
    return Promise.all(
      names.map(async (name) => {
        const extStatus: Record<string, boolean> = {};
        await Promise.all(
          extensions.map(async (ext) => {
            extStatus[ext] = await this.isDomainAvailable(`${name}${ext}`);
          }),
        );
        return { name, allExtensions: extStatus };
      }),
    );
  }

  async findAvailableDomains(
    description: string,
    keywords: string[],
    targetCount = 10,
    extensions = ['.com'],
    matchMode = MatchMode.ANY,
    locale?: string
  ): Promise<{ results: any[], totalChecked: number }> {
    const finalResults: any[] = [];
    const checkedNames = new Set<string>();
    let attempts = 0;
    const maxAttempts = 5;

    while (finalResults.length < targetCount && attempts < maxAttempts) {
      const names = await this.generateDomainIdeas(description, keywords, locale);
      
      const newNames = names.filter(name => !checkedNames.has(name));
      newNames.forEach(name => checkedNames.add(name));

      if (newNames.length === 0) {
        attempts++;
        continue;
      }

      for (const name of newNames) {
        if (finalResults.length >= targetCount) break;

        const extStatus: Record<string, boolean> = {};
        
        await Promise.all(extensions.map(async (ext) => {
          extStatus[ext] = await this.isDomainAvailable(`${name}${ext}`);
        }));

        const availableExts = Object.keys(extStatus).filter(ext => extStatus[ext]);
        
        let isMatch = false;
        if (matchMode === MatchMode.ALL) {
          isMatch = availableExts.length === extensions.length;
        } else {
          isMatch = availableExts.length > 0;
        }

        if (isMatch) {
          finalResults.push({
            name,
            availableExtensions: availableExts,
            allExtensions: extStatus
          });
        }
      }
      attempts++;
    }

    return {
      results: finalResults,
      totalChecked: checkedNames.size
    };
  }
}