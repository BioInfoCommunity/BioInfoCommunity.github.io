# Highlights

This folder holds the highlights shown on the site: announcements, new translations, activities and opportunities to contribute. Each highlight is one small YAML file. The site reads these files, so you only need to add or edit files here. You do not need to change any code.

Where highlights appear:

- **Homepage:** the three closest to today, under "Highlights".
- **Highlights page:** all of them, with a dropdown to filter by space.
- **Space pages:** the ones tagged with that space.

## Adding a highlight

1. **Copy the template.** Make a copy of `template.yaml` in this folder and rename it. Use the date the highlight is for as the file name, for example `2026-11-03.yaml`. If you have two highlights on the same day, add a short word, for example `2026-11-03-webinar.yaml`.

2. **Fill in the fields.**

   ```yaml
   title: Portuguese translation of AlphaFold
   description: Short summary, under 150 words.
   url: https://example.org/post
   community: alphafold
   date: 2026-11-03
   date_archive: 2026-12-03
   status: live
   ```

   | Field | Required | What to put in it |
   | --- | --- | --- |
   | `title` | yes | The headline shown on the site. |
   | `description` | yes | A short summary, under 150 words. |
   | `url` | no | A link for "read more". Must start with `https://`. Leave the line out if there is no link. |
   | `community` | no | The space this belongs to, using the space ID from `spaces.json`, for example `alphafold`. Leave the line out for general highlights that should only appear on the homepage and the Highlights page. |
   | `date` | yes | The date shown on the highlight, in the form `YYYY-MM-DD`. |
   | `date_archive` | no | The date the highlight stops showing, in the form `YYYY-MM-DD`. Leave the line out to keep it showing. |
   | `status` | yes | `live` to show the highlight, or `draft` to keep it hidden while you work on it. |

3. **Check the YAML.** Keep the indentation as in the template: no tabs, and each field on its own line. If a title or description contains a colon (`:`), put the whole text in double quotes, for example `title: "Webinar: research use cases"`.

4. **Publish.** Commit the new file and push it to the `main` branch. The site rebuilds on every push to `main`, and also once a day. Your highlight appears after the rebuild finishes, usually within a few minutes.

## Changing or removing a highlight

- To **change** a highlight, edit its file and push.
- To **hide** a highlight without deleting it, set `status: draft`.
- To **remove** it, set `date_archive` to a date in the past, or delete the file.

## Things to know

- A `live` highlight shows straight away, whatever its `date`. The `date` controls the order and the date shown on the card.
- Highlights are ordered by how close their `date` is to today, whether that is in the past or the future.
- Do not edit `template.yaml`. It is the reference copy and is not published.
- Files in this folder that are not highlights (this README and `template.yaml`) are skipped by the build.
- If a file has a mistake, such as a missing field or a `community` that does not match a space, the build fails and the site is not updated. Check the file against the table above and push again.
