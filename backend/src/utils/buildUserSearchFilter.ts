export const buildUserSearchFilter = async (search: string) => {
  const regex = new RegExp(search, "i");
  const singleFieldMatch = {
    $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
  };

  const parts = search.trim().split(/\s+/);
  if (parts.length >= 2) {
    const [first, ...rest] = parts;
    const last = rest.join(" ");
    return {
      $or: [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        {
          $and: [
            { firstName: new RegExp(first, "i") },
            { lastName: new RegExp(last, "i") },
          ],
        },
        {
          $and: [
            { firstName: new RegExp(last, "i") },
            { lastName: new RegExp(first, "i") },
          ],
        },
      ],
    };
  }

  return singleFieldMatch;
};
