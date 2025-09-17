Need to add a search tool for memory cards using semantic search. Memory cards support two scope types: one global scope (single instance) and initiative-specific scopes (multiple, depending on initiative count).

Use ChromaDB vector database (cromadb-ts, Context7) locally, storing data in the knowledge base root under `<root>/chromadb/` subfolder. Re-index cards immediately after changes (deletion, addition, or updates).

Use ChromaDB attributes to store FrontMatter metadata. Add scope identifier attribute to filter between global search and initiative-specific search. Use ChromaDB's default embedding model for simpler implementation.

search
	domain
		CromaDB to index the cards
			use scope attribute to separate the gloabal and initiative cards
			reindex after remove or update cards
		semantic search method
return arrays of MemoryCard
			scope
				"global"
				initiativeId
			query
			number of results
	mcp tools
		memory_cards_search
Return:
list of memory card with full content
			scope
				"global"
				initiativeId
			query
			number of results
---
# Remove duplicates in templates

---
# Optimize context loading???
 - general (always load)
 - domen scope (semantic search)
   - front
   - back
   - glue
---
workflow diagramm
readme
publish with token not work

----

Мысли по фреймворку управления контекстом для AI:

**Из видео про GitHub фреймворк:**
- К задачам добавлять списки файлов, которые могут быть затронуты
- Включать relevant context для быстрого доступа модели
- На этапе анализа модель поднимает файлы и может ими поделиться

**Проблемы текущего планирования:**
- Выпадают архитектурные решения из-за строгого списка задач
- Архитектурные решения происходят в рамках планирования инициативы

**Предложения по улучшению:**
- Сопровождать список задач технической документацией при планировании инициативы
- Создавать архитектурные гайдлайны с описаниями:
    - Структур данных
    - Респонсов
    - Диаграмм
- Использовать как полезный контекст для выполнения задач

**Недостатки:**
- При перепланировании нужно обновлять архитектурные диаграммы и сопровождающие документы
- Оценка: достижимая задача


-----
Кастомизация:
- Необходимо добавить возможность преобразования пользовательского промпта
- Реализовать как дополнительный опциональный аргумент
- Цель: добавление контекста
- Применение: для многих команд

---
Add Tag - "general" for decisions, solutions, patterns - it helps to load it always in context