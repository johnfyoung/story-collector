import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'
import { MentionArea } from '../components/MentionArea'
import { TabNav } from '../components/TabNav'
import { useStories } from '../state/StoriesProvider'
import { Disclosure } from '../components/Disclosure'
import type { Chapter, PlotLine, PlotPoint, StoryContent } from '../types'

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export default function PlotLineForm() {
  const { id: storyId, plotLineId } = useParams()
  const navigate = useNavigate()
  const { loadContent, saveContent } = useStories()
  const [content, setContent] = useState<StoryContent | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!storyId) return
    loadContent(storyId).then((c) => {
      setContent(c)
      if (plotLineId) {
        const existing = c.plotLines.find((x) => x.id === plotLineId)
        if (existing) {
          setTitle(existing.title)
          setDescription(existing.description ?? '')
          setChapters(existing.chapters)
        }
      }
    })
  }, [storyId, plotLineId, loadContent])

  const elementsIndex = useMemo(() => {
    const idx: string[] = []
    if (!content) return idx
    for (const c of content.characters) if (c.name) idx.push(c.name)
    for (const s of content.species) if (s.name) idx.push(s.name)
    for (const p of content.locations) if (p.name) idx.push(p.name)
    for (const i of content.items) if (i.name) idx.push(i.name)
    for (const g of content.groups) if (g.name) idx.push(g.name)
    for (const l of content.languages) if (l.name) idx.push(l.name)
    return idx
  }, [content])

  function addChapter() {
    const newChapter: Chapter = {
      id: genId(),
      title: '',
      description: '',
      plotPoints: [],
      order: chapters.length,
    }
    setChapters([...chapters, newChapter])
  }

  function updateChapter(id: string, updates: Partial<Chapter>) {
    setChapters((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, ...updates } : ch))
    )
  }

  function deleteChapter(id: string) {
    setChapters((prev) => prev.filter((ch) => ch.id !== id))
  }

  function moveChapterUp(index: number) {
    if (index === 0) return
    const newChapters = [...chapters]
    ;[newChapters[index - 1], newChapters[index]] = [
      newChapters[index],
      newChapters[index - 1],
    ]
    setChapters(newChapters.map((ch, i) => ({ ...ch, order: i })))
  }

  function moveChapterDown(index: number) {
    if (index === chapters.length - 1) return
    const newChapters = [...chapters]
    ;[newChapters[index], newChapters[index + 1]] = [
      newChapters[index + 1],
      newChapters[index],
    ]
    setChapters(newChapters.map((ch, i) => ({ ...ch, order: i })))
  }

  function addPlotPoint(chapterId: string) {
    const chapter = chapters.find((ch) => ch.id === chapterId)
    if (!chapter) return
    const newPlotPoint: PlotPoint = {
      id: genId(),
      title: '',
      aiPrompt: '',
      storyElements: '',
      order: chapter.plotPoints.length,
    }
    updateChapter(chapterId, {
      plotPoints: [...chapter.plotPoints, newPlotPoint],
    })
  }

  function updatePlotPoint(
    chapterId: string,
    plotPointId: string,
    updates: Partial<PlotPoint>
  ) {
    const chapter = chapters.find((ch) => ch.id === chapterId)
    if (!chapter) return
    updateChapter(chapterId, {
      plotPoints: chapter.plotPoints.map((pp) =>
        pp.id === plotPointId ? { ...pp, ...updates } : pp
      ),
    })
  }

  function deletePlotPoint(chapterId: string, plotPointId: string) {
    const chapter = chapters.find((ch) => ch.id === chapterId)
    if (!chapter) return
    updateChapter(chapterId, {
      plotPoints: chapter.plotPoints.filter((pp) => pp.id !== plotPointId),
    })
  }

  function movePlotPointUp(chapterId: string, index: number) {
    const chapter = chapters.find((ch) => ch.id === chapterId)
    if (!chapter || index === 0) return
    const newPlotPoints = [...chapter.plotPoints]
    ;[newPlotPoints[index - 1], newPlotPoints[index]] = [
      newPlotPoints[index],
      newPlotPoints[index - 1],
    ]
    updateChapter(chapterId, {
      plotPoints: newPlotPoints.map((pp, i) => ({ ...pp, order: i })),
    })
  }

  function movePlotPointDown(chapterId: string, index: number) {
    const chapter = chapters.find((ch) => ch.id === chapterId)
    if (!chapter || index === chapter.plotPoints.length - 1) return
    const newPlotPoints = [...chapter.plotPoints]
    ;[newPlotPoints[index], newPlotPoints[index + 1]] = [
      newPlotPoints[index + 1],
      newPlotPoints[index],
    ]
    updateChapter(chapterId, {
      plotPoints: newPlotPoints.map((pp, i) => ({ ...pp, order: i })),
    })
  }

  async function onSave() {
    if (!storyId || !content || !title.trim()) return
    setSaving(true)
    try {
      const plotLine: PlotLine = {
        id: plotLineId ?? genId(),
        title: title.trim(),
        description: description.trim(),
        chapters,
      }
      const next: StoryContent = {
        ...content,
        plotLines: content.plotLines.some((x) => x.id === plotLine.id)
          ? content.plotLines.map((x) => (x.id === plotLine.id ? plotLine : x))
          : [plotLine, ...content.plotLines],
      }
      await saveContent(storyId, next)
      navigate(`/stories/${storyId}/plot-lines`)
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!storyId || !content || !plotLineId) return
    const ok = confirm('Delete this plot line? This cannot be undone.')
    if (!ok) return
    setSaving(true)
    try {
      const next: StoryContent = {
        ...content,
        plotLines: content.plotLines.filter((x) => x.id !== plotLineId),
      }
      await saveContent(storyId, next)
      navigate(`/stories/${storyId}/plot-lines`)
    } finally {
      setSaving(false)
    }
  }

  if (!storyId) return null

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <TabNav active="plot-lines" storyId={storyId} />
      {plotLineId ? null : (
        <h1 style={{ color: 'var(--color-text)', margin: 0 }}>
          Add plot line
        </h1>
      )}
      <Card>
        <div style={{ display: 'grid', gap: 16 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />
          <MentionArea
            label="Description"
            value={description}
            onChange={setDescription}
            suggestions={elementsIndex}
            minHeight={80}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <div style={{ color: 'var(--color-text)', fontWeight: 600 }}>
              Chapters
            </div>
            <Button variant="ghost" onClick={addChapter}>
              Add chapter
            </Button>
          </div>

          {chapters.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>
              No chapters yet. Add a chapter to get started.
            </div>
          ) : (
            chapters.map((chapter, chapterIndex) => (
              <Card key={chapter.id}>
                <Disclosure
                  title={chapter.title || `Chapter ${chapterIndex + 1}`}
                  defaultOpen
                >
                  <div style={{ display: 'grid', gap: 12 }}>
                    <TextField
                      label="Chapter title"
                      value={chapter.title}
                      onChange={(e) =>
                        updateChapter(chapter.id, {
                          title: e.currentTarget.value,
                        })
                      }
                    />
                    <MentionArea
                      label="Chapter description"
                      value={chapter.description ?? ''}
                      onChange={(val) =>
                        updateChapter(chapter.id, { description: val })
                      }
                      suggestions={elementsIndex}
                      minHeight={60}
                    />

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 8,
                      }}
                    >
                      <div
                        style={{
                          color: 'var(--color-text-muted)',
                          fontSize: 'var(--font-sm)',
                        }}
                      >
                        Plot points
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => addPlotPoint(chapter.id)}
                      >
                        Add plot point
                      </Button>
                    </div>

                    {chapter.plotPoints.length === 0 ? (
                      <div
                        style={{
                          color: 'var(--color-text-muted)',
                          fontSize: 'var(--font-sm)',
                        }}
                      >
                        No plot points yet.
                      </div>
                    ) : (
                      chapter.plotPoints.map((plotPoint, ppIndex) => (
                        <Card
                          key={plotPoint.id}
                          style={{
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <div style={{ display: 'grid', gap: 10 }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <div
                                style={{
                                  color: 'var(--color-text-muted)',
                                  fontSize: 'var(--font-sm)',
                                }}
                              >
                                Plot point {ppIndex + 1}
                              </div>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                  onClick={() =>
                                    movePlotPointUp(chapter.id, ppIndex)
                                  }
                                  disabled={ppIndex === 0}
                                  style={{
                                    background: 'transparent',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '4px 8px',
                                    cursor:
                                      ppIndex === 0
                                        ? 'not-allowed'
                                        : 'pointer',
                                    opacity: ppIndex === 0 ? 0.5 : 1,
                                  }}
                                  title="Move up"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={() =>
                                    movePlotPointDown(chapter.id, ppIndex)
                                  }
                                  disabled={
                                    ppIndex === chapter.plotPoints.length - 1
                                  }
                                  style={{
                                    background: 'transparent',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '4px 8px',
                                    cursor:
                                      ppIndex === chapter.plotPoints.length - 1
                                        ? 'not-allowed'
                                        : 'pointer',
                                    opacity:
                                      ppIndex === chapter.plotPoints.length - 1
                                        ? 0.5
                                        : 1,
                                  }}
                                  title="Move down"
                                >
                                  ↓
                                </button>
                                <button
                                  onClick={() =>
                                    deletePlotPoint(chapter.id, plotPoint.id)
                                  }
                                  style={{
                                    background: 'transparent',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    color: 'crimson',
                                  }}
                                  title="Delete plot point"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                            <TextField
                              label="Title"
                              value={plotPoint.title}
                              onChange={(e) =>
                                updatePlotPoint(chapter.id, plotPoint.id, {
                                  title: e.currentTarget.value,
                                })
                              }
                            />
                            <MentionArea
                              label="AI Prompt"
                              value={plotPoint.aiPrompt ?? ''}
                              onChange={(val) =>
                                updatePlotPoint(chapter.id, plotPoint.id, {
                                  aiPrompt: val,
                                })
                              }
                              suggestions={elementsIndex}
                              minHeight={80}
                            />
                            <MentionArea
                              label="Story Elements"
                              value={plotPoint.storyElements ?? ''}
                              onChange={(val) =>
                                updatePlotPoint(chapter.id, plotPoint.id, {
                                  storyElements: val,
                                })
                              }
                              suggestions={elementsIndex}
                              minHeight={60}
                            />
                          </div>
                        </Card>
                      ))
                    )}

                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        justifyContent: 'flex-end',
                        marginTop: 8,
                      }}
                    >
                      <button
                        onClick={() => moveChapterUp(chapterIndex)}
                        disabled={chapterIndex === 0}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '6px 12px',
                          cursor:
                            chapterIndex === 0 ? 'not-allowed' : 'pointer',
                          opacity: chapterIndex === 0 ? 0.5 : 1,
                          color: 'var(--color-text)',
                        }}
                      >
                        Move chapter up
                      </button>
                      <button
                        onClick={() => moveChapterDown(chapterIndex)}
                        disabled={chapterIndex === chapters.length - 1}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '6px 12px',
                          cursor:
                            chapterIndex === chapters.length - 1
                              ? 'not-allowed'
                              : 'pointer',
                          opacity:
                            chapterIndex === chapters.length - 1 ? 0.5 : 1,
                          color: 'var(--color-text)',
                        }}
                      >
                        Move chapter down
                      </button>
                      <button
                        onClick={() => deleteChapter(chapter.id)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          color: 'crimson',
                        }}
                      >
                        Delete chapter
                      </button>
                    </div>
                  </div>
                </Disclosure>
              </Card>
            ))
          )}

          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              marginTop: 16,
            }}
          >
            <div>
              {plotLineId ? (
                <Button variant="ghost" onClick={onDelete}>
                  Delete plot line
                </Button>
              ) : null}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="ghost"
                type="button"
                onClick={() => navigate(`/stories/${storyId}/plot-lines`)}
              >
                Cancel
              </Button>
              <Button onClick={onSave} disabled={saving || !title.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
