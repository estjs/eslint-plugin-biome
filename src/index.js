import { name, version } from '../package.json';
import { generateDifferences, showInvisibles } from './helpers';
import BiomeConfig from '../biome.json';
const { INSERT, DELETE, REPLACE } = generateDifferences;
import Biome from './biome';

/**
 * Reports a difference.
 *
 * @param {import('eslint').Rule.RuleContext} context - The ESLint rule context.
 * @param {import('prettier-linter-helpers').Difference} difference - The difference object.
 * @returns {void}
 */
function reportDifference(context, difference) {
	const { operation, offset, deleteText = '', insertText = '' } = difference;
	const range = [offset, offset + deleteText.length];
	const [start, end] = range.map(index => context.sourceCode.getLocFromIndex(index));
	context.report({
		messageId: operation,
		data: {
			deleteText: showInvisibles(deleteText),
			insertText: showInvisibles(insertText),
		},
		loc: { start, end },
		fix: fixer => fixer.replaceTextRange(range, insertText),
	});
}
let biome


const eslintPluginBiome = {
	meta: { name, version },
	configs: {
		recommended: {
			plugins: ['biome'],
			rules: {
				'biome/biome': 'warn',
			},
		},
	},
	rules: {
		biome: {
			meta: {
				type: 'layout',
				fixable: 'code',
				docs: {
					description: '',
					recommended: 'warn',
				},
				messages: {
					[INSERT]: 'Insert `{{ insertText }}`',
					[DELETE]: 'Delete `{{ deleteText }}`',
					[REPLACE]: 'Replace `{{ deleteText }}` with `{{ insertText }}`',
				},
				schema: [
					{
						type: 'object',
						properties: {},
						additionalProperties: true,
					},
				],
			},
			async create(context) {
				//TODO:
				const useCustomConfig = !context.options[1] || context.options[1].useCustomConfig !== false;
				const fileInfoOptions = (context.options[1] && context.options[1].fileInfoOptions) || {};
				const sourceCode = context.sourceCode ?? context.getSourceCode();
				const filePath = context.filename ?? context.getFilename();
				const onDiskFilepath = context.physicalFilename ?? context.getPhysicalFilename();
				const source = sourceCode.text;
				if (!biome) {
					biome = await Biome.create();
					biome.applyConfiguration({ ...BiomeConfig, ...useCustomConfig });

				}

				return {
					Program() {
							let content;
							try {
								const formatted = biome.formatContent(source, {
									...fileInfoOptions,
									filePath,
									onDiskFilepath,
								});
								content = formatted.content;
							} catch (error_) {
								if (!(error_ instanceof SyntaxError)) {
									throw error_;
								}
								const message = `Parsing error: ${error_.message}`;
								const error = /** @type {SyntaxError & {codeFrame: string; loc: SourceLocation}} */ (error_);
								context.report({ message, loc: error });
								return;
							}

							if (!content) {
								return;
							}
							if (source !== content) {
								const differences = generateDifferences(source, content);
								for (const difference of differences) {
									reportDifference(context, difference);
								}
							}
					},

				};
			},
		},
	},
};
export default eslintPluginBiome;
