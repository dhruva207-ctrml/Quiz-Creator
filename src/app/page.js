"use client";

import { useCallback, useEffect, useState } from "react";
import { getQuizQuestions, saveQuizQuestion } from "@/lib/dbmanager";

const optionKeys = ["A", "B", "C", "D"];
const emptyForm = {
  question: "",
  options: { A: "", B: "", C: "", D: "" },
  correctAnswer: "A",
};

const inputClassName =
  "mt-2 w-full rounded-md bg-[#1e1f22] p-3 text-white outline-none placeholder:text-[#949ba4] focus:ring-2 focus:ring-[#5865f2]";

export default function QuizPage() {
  const [form, setForm] = useState(emptyForm);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formMessage, setFormMessage] = useState(null);

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      setQuestions(await getQuizQuestions());
    } catch (error) {
      console.error("Unable to load quiz questions from Firebase.", error);
      setLoadError(
        error instanceof Error ? error.message : "Unable to load quiz questions.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;

    getQuizQuestions()
      .then((loadedQuestions) => {
        if (isCurrent) {
          setQuestions(loadedQuestions);
        }
      })
      .catch((error) => {
        if (isCurrent) {
          console.error("Unable to load quiz questions from Firebase.", error);
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load quiz questions.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  function updateOption(key, value) {
    setForm((currentForm) => ({
      ...currentForm,
      options: { ...currentForm.options, [key]: value },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setFormMessage(null);

    try {
      await saveQuizQuestion(form);
      setForm(emptyForm);
      setFormMessage({
        type: "success",
        text: "Question saved to your quiz bank.",
      });
      await loadQuestions();
    } catch (error) {
      console.error("Unable to save quiz question to Firebase.", error);
      setFormMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to save the question. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-start justify-center bg-[#313338] px-4 py-8">
      <div className="w-full max-w-3xl space-y-8 rounded-xl bg-[#2b2d31] p-6 text-white shadow-2xl sm:p-8">
        <header>
          <h1 className="text-center text-3xl font-bold">Quiz Creator</h1>
          <p className="mt-2 text-center text-sm text-[#b5bac1]">
            Add multiple-choice questions and review saved questions below.
          </p>
        </header>

        <section aria-labelledby="create-question-title">
          <h2
            className="mb-4 text-xl font-bold text-[#dbdee1]"
            id="create-question-title"
          >
            Add a question
          </h2>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-bold text-[#dbdee1]">
              Quiz question
              <textarea
                className={`${inputClassName} min-h-20 resize-y`}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    question: event.target.value,
                  }))
                }
                placeholder="e.g. What is React?"
                required
                rows={3}
                value={form.question}
              />
            </label>

            <fieldset>
              <legend className="text-sm font-bold text-[#dbdee1]">
                Answer options
              </legend>
              <div className="mt-3 grid gap-3">
                {optionKeys.map((key) => (
                  <label
                    className="block text-sm font-bold text-[#dbdee1]"
                    key={key}
                  >
                    Option {key}
                    <input
                      className={inputClassName}
                      onChange={(event) => updateOption(key, event.target.value)}
                      placeholder={`Enter option ${key}`}
                      required
                      value={form.options[key]}
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-[#dbdee1]">
                Correct answer
                <select
                  className={inputClassName}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      correctAnswer: event.target.value,
                    }))
                  }
                  value={form.correctAnswer}
                >
                  {optionKeys.map((key) => (
                    <option key={key} value={key}>
                      Option {key}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="w-full rounded-md bg-[#5865f2] py-3 text-sm font-bold text-white transition hover:bg-[#4752c4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5865f2] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? "Saving..." : "Save Question"}
              </button>
            </div>

            {formMessage && (
              <p
                className={`text-sm ${
                  formMessage.type === "success"
                    ? "text-emerald-300"
                    : "text-rose-300"
                }`}
                role={formMessage.type === "error" ? "alert" : "status"}
                aria-live="polite"
              >
                {formMessage.text}
              </p>
            )}
          </form>
        </section>

        <section
          aria-labelledby="saved-questions-title"
          className="border-t border-[#404249] pt-6"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2
              className="text-xl font-bold text-[#dbdee1]"
              id="saved-questions-title"
            >
              Saved questions ({questions.length})
            </h2>
            <button
              className="rounded-md border border-[#4e5058] px-3 py-2 text-sm text-[#dbdee1] hover:bg-[#383a40] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5865f2] disabled:opacity-60"
              disabled={isLoading}
              onClick={loadQuestions}
              type="button"
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loadError ? (
            <p className="text-sm text-rose-300" role="alert">
              {loadError}
            </p>
          ) : isLoading && questions.length === 0 ? (
            <p className="text-sm text-[#b5bac1]" role="status">
              Loading questions...
            </p>
          ) : questions.length === 0 ? (
            <p className="text-sm text-[#b5bac1]">No questions saved yet.</p>
          ) : (
            <ol className="divide-y divide-[#404249]">
              {[...questions].reverse().map((savedQuestion) => (
                <li className="py-4" key={savedQuestion.id}>
                  <h3 className="font-semibold text-[#f2f3f5]">
                    {savedQuestion.question}
                  </h3>
                  <ul className="mt-2 grid gap-1 text-sm text-[#b5bac1]">
                    {optionKeys.map((key) => (
                      <li key={key}>
                        <span className="font-semibold text-[#dbdee1]">
                          {key}.
                        </span>{" "}
                        {savedQuestion.options[key]}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm text-[#dbdee1]">
                    <span className="font-semibold">Correct answer:</span>{" "}
                    Option {savedQuestion.correctAnswer}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
